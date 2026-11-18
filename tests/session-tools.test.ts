// 会话工具测试：筛选、分页、标题读取、消息截断与预算、错误文案。
import { describe, expect, it, vi } from 'vitest';

import type {
  SessionQueryLike,
  SessionRecordLike,
  SessionSurfaceLike,
  SessionTitleObservationLike,
} from '../src/types.ts';
import { buildSessionTool } from '../src/session-tools.ts';
import { makeCtx } from './helpers.ts';

/** 构造一个会话记录。 */
function makeRecord(
  id: string,
  createdAt: number,
  overrides: { cwd?: string; live?: boolean } = {},
): SessionRecordLike {
  return {
    header: { id, createdAt, ...(overrides.cwd === undefined ? {} : { cwd: overrides.cwd }) },
    live: overrides.live ?? false,
    persisted: true,
  };
}

/** 构造一条 text 消息事件。 */
function messageEvent(type: 'user/message' | 'assistant/message', text: string) {
  return { type, data: { content: [{ type: 'text', text }] } };
}

/** 构造一个会话 surface。 */
function makeSurface(
  id: string,
  options: { createdAt?: number; cwd?: string; agentPreset?: string; events?: unknown[]; lastSeq?: number | null } = {},
): SessionSurfaceLike {
  return {
    session: {
      id,
      createdAt: options.createdAt ?? 1,
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
      ...(options.agentPreset === undefined ? {} : { agentPreset: options.agentPreset }),
    },
    capturedThroughSeq: options.lastSeq === undefined ? 0 : options.lastSeq,
    events: (options.events ?? []) as SessionSurfaceLike['events'],
  };
}

/** 假会话查询。 */
function makeQuery(options: {
  records?: SessionRecordLike[];
  surfaces?: Record<string, SessionSurfaceLike>;
  titles?: Record<string, string>;
  titleError?: Error;
}) {
  const readTitleSnapshots = vi.fn(
    async (ids: readonly string[]): Promise<SessionTitleObservationLike[]> => {
      if (options.titleError !== undefined) throw options.titleError;
      return ids.map((id) => {
        const title = options.titles?.[id];
        return title === undefined
          ? { sessionId: id, status: 'rejected' as const }
          : { sessionId: id, status: 'fulfilled' as const, value: { title } };
      });
    },
  );
  const readSurface = vi.fn(async (id: string) => {
    const surface = options.surfaces?.[id];
    if (surface === undefined) throw new Error(`no such session: ${id}`);
    return surface;
  });
  const query: SessionQueryLike = {
    listSessions: vi.fn(async () => options.records ?? []),
    readSurface,
    readTitleSnapshots,
  };
  return { query, readTitleSnapshots, readSurface };
}

/** 带可选服务的 ctx 与工具。 */
function setup(options: Parameters<typeof makeQuery>[0]) {
  const ctx = makeCtx();
  const { query, readTitleSnapshots, readSurface } = makeQuery(options);
  ctx._setService('sessionQuery', query);
  const build = (name: Parameters<typeof buildSessionTool>[0]) =>
    buildSessionTool(name, { ctx, sessionQuery: query });
  return { ctx, query, readTitleSnapshots, readSurface, build };
}

/** 工具执行上下文桩。 */
const exec = { signal: new AbortController().signal } as never;

describe('session_list', () => {
  it('按创建时间倒序返回一页并读取标题', async () => {
    const { build, readTitleSnapshots } = setup({
      records: [makeRecord('s1', 1), makeRecord('s2', 3, { cwd: 'D:\\a' }), makeRecord('s3', 2)],
      titles: { s1: '第一', s2: '第二' },
    });
    const tool = build('session_list');
    const value = (await tool.execute({}, exec)) as {
      total: number;
      returned: number;
      sessions: Array<Record<string, unknown>>;
    };
    expect(value.total).toBe(3);
    expect(value.returned).toBe(3);
    expect(value.sessions.map((session) => session.id)).toEqual(['s2', 's3', 's1']);
    expect(value.sessions[0]).toMatchObject({ title: '第二', cwd: 'D:\\a', live: false });
    expect(value.sessions[2]).toMatchObject({ title: '第一' });
    expect(readTitleSnapshots).toHaveBeenCalledWith(['s2', 's3', 's1'], expect.anything());
  });

  it('按 workspace_id、cwd、归档与 limit 过滤', async () => {
    const ctx = makeCtx();
    const { query } = makeQuery({
      records: [
        makeRecord('s1', 1, { cwd: 'D:\\a' }),
        makeRecord('s2', 2, { cwd: 'D:\\b' }),
        makeRecord('s3', 3, { cwd: 'D:\\a' }),
        makeRecord('s4', 4, { cwd: 'D:\\a' }),
      ],
    });
    ctx._setService('sessionQuery', query);
    ctx._setService('workspaceRegistry', {
      get: (id: string) =>
        id === 'w1'
          ? { id: 'w1', title: 'W', path: 'D:\\a', sessionIds: ['s1', 's3'], createdAt: '', updatedAt: '', status: async () => 'ok', setTitle: async () => undefined }
          : undefined,
      archivedSessionIds: ['s3'],
      pinnedSessionIds: ['s1'],
    });
    const tool = (name: 'session_list') => buildSessionTool(name, { ctx, sessionQuery: query });

    const scoped = (await tool('session_list').execute(
      { workspace_id: 'w1', limit: 1 },
      exec,
    )) as { total: number; sessions: Array<{ id: string; archived: boolean; pinned: boolean }> };
    expect(scoped.total).toBe(1);
    expect(scoped.sessions[0]?.id).toBe('s1');
    expect(scoped.sessions[0]?.pinned).toBe(true);

    const byCwd = (await tool('session_list').execute(
      { cwd: 'D:\\a', include_archived: true },
      exec,
    )) as { sessions: Array<{ id: string }> };
    expect(byCwd.sessions.map((session) => session.id)).toEqual(['s4', 's3', 's1']);
  });

  it('未知 workspace_id 报错', async () => {
    const { ctx, query, build } = setup({ records: [] });
    ctx._setService('workspaceRegistry', { get: () => undefined });
    await expect(
      build('session_list').execute({ workspace_id: 'nope' }, exec),
    ).rejects.toThrow("No workspace with id 'nope'");
  });

  it('缺少工作区服务时带 workspace_id 报错', async () => {
    const { build } = setup({ records: [] });
    await expect(
      build('session_list').execute({ workspace_id: 'w1' }, exec),
    ).rejects.toThrow('Workspace listing is unavailable in this profile.');
  });

  it('titles=false 时跳过标题读取', async () => {
    const { build, readTitleSnapshots } = setup({ records: [makeRecord('s1', 1)] });
    await build('session_list').execute({ titles: false }, exec);
    expect(readTitleSnapshots).not.toHaveBeenCalled();
  });

  it('页长超过 40 时跳过标题读取', async () => {
    const records = Array.from({ length: 41 }, (_value, index) => makeRecord(`s${index}`, index));
    const { build, readTitleSnapshots } = setup({ records });
    const value = (await build('session_list').execute({ limit: 41 }, exec)) as {
      returned: number;
      sessions: Array<{ title?: string }>;
    };
    expect(value.returned).toBe(41);
    expect(readTitleSnapshots).not.toHaveBeenCalled();
    expect(value.sessions[0]?.title).toBeUndefined();
  });

  it('标题读取失败时返回 note', async () => {
    const { build } = setup({
      records: [makeRecord('s1', 1)],
      titleError: new Error('disk offline'),
    });
    const value = (await build('session_list').execute({}, exec)) as {
      note?: string;
      sessions: Array<unknown>;
    };
    expect(value.note).toContain('Stored titles could not be read: disk offline');
    expect(value.sessions).toHaveLength(1);
  });

  it('渲染数量、摘要与说明', async () => {
    const { build } = setup({
      records: [makeRecord('s1', 1, { cwd: 'D:\\a', live: true })],
      titles: { s1: '第一' },
    });
    const tool = build('session_list');
    const value = await tool.execute({}, exec);
    const [block] = tool.output.render({}, value as never);
    const text = (block as { text: string }).text;
    expect(text).toContain('1 of 1 session(s), newest first');
    expect(text).toContain('第一 — s1');
    expect(text).toContain('D:\\a');
    expect(text).toContain('live');
  });
});

describe('session_get', () => {
  it('返回元数据与最新消息', async () => {
    const { build } = setup({
      records: [makeRecord('s1', 1)],
      titles: { s1: '标题' },
      surfaces: {
        s1: makeSurface('s1', {
          createdAt: 1000,
          cwd: 'D:\\a',
          agentPreset: 'standard',
          lastSeq: 4,
          events: [messageEvent('user/message', 'hi'), messageEvent('assistant/message', 'hello')],
        }),
      },
    });
    const tool = build('session_get');
    const value = (await tool.execute({ session_id: 's1' }, exec)) as {
      title: string;
      cwd: string;
      agentPreset: string;
      eventCount: number;
      messages: Array<{ role: string; text: string }>;
      createdAt: string;
    };
    expect(value.title).toBe('标题');
    expect(value.cwd).toBe('D:\\a');
    expect(value.agentPreset).toBe('standard');
    expect(value.eventCount).toBe(5);
    expect(value.createdAt).toBe('1970-01-01T00:00:01.000Z');
    expect(value.messages).toEqual([
      { role: 'user', text: 'hi' },
      { role: 'assistant', text: 'hello' },
    ]);
  });

  it('messages=0 只返回元数据', async () => {
    const { build } = setup({
      records: [],
      surfaces: { s1: makeSurface('s1', { events: [messageEvent('user/message', 'hi')] }) },
    });
    const value = (await build('session_get').execute(
      { session_id: 's1', messages: 0 },
      exec,
    )) as Record<string, unknown>;
    expect(value.messages).toBeUndefined();
    expect(value.eventCount).toBe(1);
  });

  it('单条超过 2000 字符时截断', async () => {
    const long = 'x'.repeat(2500);
    const { build } = setup({
      surfaces: { s1: makeSurface('s1', { events: [messageEvent('user/message', long)] }) },
    });
    const value = (await build('session_get').execute({ session_id: 's1' }, exec)) as {
      messages: Array<{ text: string; truncated?: boolean }>;
    };
    const [first] = value.messages;
    expect(first?.truncated).toBe(true);
    expect(first?.text.endsWith('… [truncated]')).toBe(true);
    expect(first?.text.length).toBe(2000 + '\n… [truncated]'.length);
  });

  it('总预算 12000 字符超出时省略后续消息', async () => {
    const text = 'y'.repeat(2000);
    const events = Array.from({ length: 7 }, () => messageEvent('user/message', text));
    const { build } = setup({ surfaces: { s1: makeSurface('s1', { events }) } });
    const value = (await build('session_get').execute({ session_id: 's1' }, exec)) as {
      messages: Array<{ text: string }>;
    };
    expect(value.messages).toHaveLength(7);
    expect(value.messages[6]?.text).toBe('… [omitted: result budget reached]');
  });

  it('live 由 sessions 服务决定', async () => {
    const { ctx, build } = setup({ surfaces: { s1: makeSurface('s1') } });
    ctx._setService('sessions', { get: (id: string) => (id === 's1' ? {} : undefined) });
    const value = (await build('session_get').execute({ session_id: 's1' }, exec)) as {
      live: boolean;
    };
    expect(value.live).toBe(true);
  });

  it('空 id 与读取失败报错', async () => {
    const { build } = setup({ surfaces: {} });
    await expect(build('session_get').execute({ session_id: ' ' }, exec)).rejects.toThrow(
      'session_id must not be empty',
    );
    await expect(build('session_get').execute({ session_id: 'nope' }, exec)).rejects.toThrow(
      "Could not read session 'nope': no such session: nope",
    );
  });

  it('渲染元数据与消息分段', async () => {
    const { build } = setup({
      titles: { s1: '标题' },
      surfaces: {
        s1: makeSurface('s1', {
          events: [messageEvent('user/message', 'hi'), messageEvent('assistant/message', 'hello')],
        }),
      },
    });
    const tool = build('session_get');
    const value = await tool.execute({ session_id: 's1' }, exec);
    const [block] = tool.output.render({}, value as never);
    const text = (block as { text: string }).text;
    expect(text).toContain('session s1');
    expect(text).toContain('title: 标题');
    expect(text).toContain('--- user ---');
    expect(text).toContain('--- assistant ---');
  });
});