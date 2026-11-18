// 工作区工具测试：列表视图、幂等创建、重命名、移除与错误文案。
import { describe, expect, it, vi } from 'vitest';

import type { WorkspaceLike, WorkspaceRegistryLike } from '../src/types.ts';
import { buildWorkspaceTool } from '../src/workspace-tools.ts';
import { makeCtx } from './helpers.ts';

/** 构造一个工作区；setTitle 会同步更新 title。 */
function makeWorkspace(overrides: Partial<WorkspaceLike> = {}): WorkspaceLike {
  const workspace = {
    id: 'w1',
    title: '项目 A',
    path: 'D:\\projects\\a',
    sessionIds: [] as string[],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    status: async () => 'ok' as const,
    setTitle: vi.fn(async (title: string) => {
      workspace.title = title;
    }),
    ...overrides,
  };
  return workspace as unknown as WorkspaceLike;
}

/** 假注册表：保留工作区顺序与归档/固定集合，记录写操作。 */
function makeRegistry(workspaces: WorkspaceLike[]) {
  const state = {
    workspaces,
    archived: [] as string[],
    pinned: [] as string[],
  };
  const create = vi.fn(async (path: string, title?: string) => {
    const created = makeWorkspace({
      id: `w${state.workspaces.length + 1}`,
      title: title ?? path.split('\\').at(-1) ?? path,
      path,
    });
    state.workspaces.push(created);
    return created;
  });
  const remove = vi.fn(async (id: string) => {
    const index = state.workspaces.findIndex((workspace) => workspace.id === id);
    if (index < 0) return false;
    state.workspaces.splice(index, 1);
    return true;
  });
  const registry: WorkspaceRegistryLike = {
    list: () => state.workspaces,
    get: (id) => state.workspaces.find((workspace) => workspace.id === id),
    resolveByPath: vi.fn(async (path) => state.workspaces.find((workspace) => workspace.path === path)),
    create,
    delete: remove,
    get archivedSessionIds() {
      return state.archived;
    },
    get pinnedSessionIds() {
      return state.pinned;
    },
  };
  return { registry, state, create, remove };
}

/** 带注册表服务的 ctx 与工具。 */
function setup(workspaces: WorkspaceLike[]) {
  const ctx = makeCtx();
  const { registry, state, create, remove } = makeRegistry(workspaces);
  ctx._setService('workspaceRegistry', registry);
  const build = (name: Parameters<typeof buildWorkspaceTool>[0]) =>
    buildWorkspaceTool(name, { ctx, registry });
  return { ctx, registry, state, create, remove, build };
}

/** 工具执行上下文桩。 */
const exec = { signal: new AbortController().signal } as never;

describe('workspace_list', () => {
  it('返回全部工作区与会话计数', async () => {
    const first = makeWorkspace({ sessionIds: ['s1', 's2', 's3'] });
    const second = makeWorkspace({
      id: 'w2',
      title: '项目 B',
      path: 'D:\\projects\\b',
      sessionIds: ['s4'],
      status: async () => 'missing-dir',
    });
    const { build, state } = setup([first, second]);
    state.archived = ['s1'];
    state.pinned = ['s2'];

    const value = (await build('workspace_list').execute({}, exec)) as {
      count: number;
      workspaces: Array<Record<string, unknown>>;
    };
    expect(value.count).toBe(2);
    expect(value.workspaces[0]).toMatchObject({
      id: 'w1',
      title: '项目 A',
      sessionCount: 3,
      archivedSessionCount: 1,
      pinnedSessionCount: 1,
      status: 'ok',
    });
    expect(value.workspaces[1]).toMatchObject({ id: 'w2', status: 'missing-dir', sessionCount: 1 });
  });

  it('渲染数量、明细与目录缺失', async () => {
    const { build } = setup([
      makeWorkspace({ sessionIds: ['s1', 's2'], status: async () => 'missing-dir' }),
    ]);
    const tool = build('workspace_list');
    const value = await tool.execute({}, exec);
    const [block] = tool.output.render({}, value as never);
    const text = (block as { text: string }).text;
    expect(text).toContain('1 workspace');
    expect(text).toContain('项目 A — D:\\projects\\a');
    expect(text).toContain('2 session(s)');
    expect(text).toContain('directory missing');
  });
});

describe('workspace_create', () => {
  it('目录已注册时返回 created=false 且不调用 create', async () => {
    const { build, create } = setup([makeWorkspace()]);
    const tool = build('workspace_create');
    const value = (await tool.execute({ path: 'D:\\projects\\a' }, exec)) as Record<string, unknown>;
    expect(value.created).toBe(false);
    expect(value.note).toContain('already registered');
    expect(create).not.toHaveBeenCalled();
    const [block] = tool.output.render({}, value as never);
    expect((block as { text: string }).text).toContain('workspace already registered');
  });

  it('新目录注册并返回 created=true', async () => {
    const { build, create, state } = setup([]);
    const tool = build('workspace_create');
    const value = (await tool.execute({ path: 'D:\\projects\\new', title: 'New' }, exec)) as Record<
      string,
      unknown
    >;
    expect(value.created).toBe(true);
    expect(create).toHaveBeenCalledWith('D:\\projects\\new', 'New');
    expect(state.workspaces).toHaveLength(1);
    const [block] = tool.output.render({}, value as never);
    expect((block as { text: string }).text).toContain('workspace created: New');
  });

  it('相对路径与空路径报参数错误', async () => {
    const { build } = setup([]);
    const tool = build('workspace_create');
    await expect(tool.execute({ path: 'relative' }, exec)).rejects.toThrow(
      'path must be an absolute path of an existing directory',
    );
    await expect(tool.execute({ path: '   ' }, exec)).rejects.toThrow(
      'path must be an absolute path of an existing directory',
    );
  });

  it('注册失败时带路径与原因', async () => {
    const { ctx, registry, build } = setup([]);
    registry.resolveByPath = vi.fn(async () => {
      throw new Error('disk offline');
    });
    const tool = build('workspace_create');
    await expect(tool.execute({ path: 'D:\\projects\\x' }, exec)).rejects.toThrow(
      "Could not register 'D:\\projects\\x' as a workspace: disk offline",
    );
    expect(ctx).toBeDefined();
  });
});

describe('workspace_rename', () => {
  it('修改标题并返回新视图', async () => {
    const workspace = makeWorkspace();
    const { build } = setup([workspace]);
    const value = (await build('workspace_rename').execute(
      { workspace_id: 'w1', title: '新标题' },
      exec,
    )) as { workspace: { title: string } };
    expect(workspace.setTitle).toHaveBeenCalledWith('新标题');
    expect(value.workspace.title).toBe('新标题');
  });

  it('未知 id 与空标题报错', async () => {
    const { build } = setup([makeWorkspace()]);
    await expect(
      build('workspace_rename').execute({ workspace_id: 'nope', title: 'x' }, exec),
    ).rejects.toThrow("No workspace with id 'nope'");
    await expect(
      build('workspace_rename').execute({ workspace_id: 'w1', title: '  ' }, exec),
    ).rejects.toThrow('title must not be empty');
  });
});

describe('workspace_remove', () => {
  it('只移除注册并返回路径', async () => {
    const { build, remove, state } = setup([makeWorkspace()]);
    const tool = build('workspace_remove');
    const value = (await tool.execute({ workspace_id: 'w1' }, exec)) as Record<string, unknown>;
    expect(remove).toHaveBeenCalledWith('w1');
    expect(state.workspaces).toHaveLength(0);
    expect(value).toEqual({ removed: true, removedId: 'w1', path: 'D:\\projects\\a' });
    const [block] = tool.output.render({}, value as never);
    expect((block as { text: string }).text).toContain('removed workspace w1');
  });

  it('未知 id 报错', async () => {
    const { build } = setup([]);
    await expect(build('workspace_remove').execute({ workspace_id: 'nope' }, exec)).rejects.toThrow(
      "No workspace with id 'nope'",
    );
  });
});