// 会话列表测试：筛选、排序、标题查询、调用方排除、subagent 归并与说明文案。
import { describe, expect, it, vi } from 'vitest';
import { buildSessionTool } from '../src/session-tools.ts';
import type {
  SessionQueryLike,
  SessionRecordLike,
  SessionTitleObservationLike,
} from '../src/types.ts';
import { makeCtx } from './helpers.ts';

/** 构造一个会话记录。 */
function makeRecord(
  id: string,
  createdAt: number,
  overrides: { cwd?: string; live?: boolean; parentId?: string } = {},
): SessionRecordLike {
  return {
    header: {
      id,
      createdAt,
      ...(overrides.cwd === undefined ? {} : { cwd: overrides.cwd }),
      ...(overrides.parentId === undefined ? {} : { parentSession: overrides.parentId }),
    },
    live: overrides.live ?? false,
    persisted: true,
  };
}

/** 假会话查询。 */
function makeQuery(options: {
  records?: SessionRecordLike[];
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
          : { sessionId: id, status: 'fulfilled' as const, value: { title: { title } } };
      });
    },
  );
  const query: SessionQueryLike = {
    listSessions: vi.fn(async () => options.records ?? []),
    readTitleSnapshots,
    readSession: vi.fn(async () => {
      throw new Error('unused');
    }),
    traceSession: vi.fn(async () => {
      throw new Error('unused');
    }),
  };
  return { query, readTitleSnapshots };
}

/** 带可选服务的 ctx 与工具。 */
function setup(options: Parameters<typeof makeQuery>[0]) {
  const ctx = makeCtx();
  const { query, readTitleSnapshots } = makeQuery(options);
  ctx._setService('sessionQuery', query);
  const build = () => buildSessionTool('session_list', { ctx, sessionQuery: query });
  return { ctx, query, readTitleSnapshots, build };
}

/** 工具执行上下文桩。 */
function execWith(callerId?: string) {
  return {
    signal: new AbortController().signal,
    ...(callerId === undefined ? {} : { agent: { session: { id: callerId } } }),
  } as never;
}

/** 默认执行上下文。 */
const exec = execWith();

describe('session_list', () => {
  it('按创建时间倒序返回一页并读取标题', async () => {
    const { build, readTitleSnapshots } = setup({
      records: [makeRecord('s1', 1), makeRecord('s2', 3, { cwd: 'D:\\a' }), makeRecord('s3', 2)],
      titles: { s1: '第一', s2: '第二' },
    });
    const value = (await build().execute({}, exec)) as {
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
          ? {
              id: 'w1',
              title: 'W',
              path: 'D:\\a',
              sessionIds: ['s1', 's3'],
              createdAt: '',
              updatedAt: '',
              status: async () => 'ok',
              setTitle: async () => undefined,
            }
          : undefined,
      archivedSessionIds: ['s3'],
      pinnedSessionIds: ['s1'],
    });
    const tool = () => buildSessionTool('session_list', { ctx, sessionQuery: query });

    const scoped = (await tool().execute({ workspace_id: 'w1', limit: 1 }, exec)) as {
      total: number;
      sessions: Array<{ id: string; archived: boolean; pinned: boolean }>;
    };
    expect(scoped.total).toBe(1);
    expect(scoped.sessions[0]?.id).toBe('s1');
    expect(scoped.sessions[0]?.pinned).toBe(true);

    const byCwd = (await tool().execute({ cwd: 'D:\\a', include_archived: true }, exec)) as {
      sessions: Array<{ id: string }>;
    };
    expect(byCwd.sessions.map((session) => session.id)).toEqual(['s4', 's3', 's1']);
  });

  it('未知 workspace_id 报错', async () => {
    const { ctx, build } = setup({ records: [] });
    ctx._setService('workspaceRegistry', { get: () => undefined });
    await expect(build().execute({ workspace_id: 'nope' }, exec)).rejects.toThrow(
      "No workspace with id 'nope'",
    );
  });

  it('缺少工作区服务时带 workspace_id 报错', async () => {
    const { build } = setup({ records: [] });
    await expect(build().execute({ workspace_id: 'w1' }, exec)).rejects.toThrow(
      'Workspace listing is unavailable.',
    );
  });

  it('titles=false 时跳过标题读取', async () => {
    const { build, readTitleSnapshots } = setup({ records: [makeRecord('s1', 1)] });
    await build().execute({ titles: false }, exec);
    expect(readTitleSnapshots).not.toHaveBeenCalled();
  });

  it('标题读取失败时返回 note', async () => {
    const { build } = setup({
      records: [makeRecord('s1', 1)],
      titleError: new Error('disk offline'),
    });
    const value = (await build().execute({}, exec)) as {
      note?: string;
      sessions: Array<unknown>;
    };
    expect(value.note).toContain('Stored titles could not be read: disk offline');
    expect(value.sessions).toHaveLength(1);
  });

  it('query 大小写不敏感匹配标题并排除调用方会话', async () => {
    const { build, readTitleSnapshots } = setup({
      records: [makeRecord('s1', 3), makeRecord('s2', 2), makeRecord('s3', 1)],
      titles: { s1: 'Alpha task', s2: 'beta ALPHA', s3: 'gamma' },
    });
    const value = (await build().execute({ query: 'ALPHA' }, execWith('s1'))) as {
      total: number;
      sessions: Array<{ id: string }>;
    };
    expect(value.total).toBe(1);
    expect(value.sessions.map((session) => session.id)).toEqual(['s2']);
    expect(readTitleSnapshots).toHaveBeenCalled();
  });

  it('subagent 会话归并到主会话且只出现一次', async () => {
    const { build } = setup({
      records: [
        makeRecord('s1', 4),
        makeRecord('s2', 3, { cwd: 'D:\\main' }),
        makeRecord('s3', 2, { parentId: 's2' }),
        makeRecord('s4', 1, { parentId: 's3' }),
      ],
      titles: { s1: 'main one', s2: 'Alpha main' },
    });
    const value = (await build().execute({ query: 'alpha' }, execWith('s1'))) as {
      total: number;
      sessions: Array<{ id: string }>;
    };
    expect(value.total).toBe(1);
    expect(value.sessions.map((session) => session.id)).toEqual(['s2']);
  });

  it('调用方是 subagent 时排除其主会话', async () => {
    const { build } = setup({
      records: [makeRecord('s1', 3), makeRecord('s2', 2), makeRecord('s3', 1, { parentId: 's2' })],
      titles: { s1: 'one', s2: 'two' },
    });
    const value = (await build().execute({}, execWith('s3'))) as {
      sessions: Array<{ id: string }>;
    };
    expect(value.sessions.map((session) => session.id)).toEqual(['s1']);
  });

  it('候选超过扫描上限时附说明并只扫描最新 200 个', async () => {
    const records = Array.from({ length: 201 }, (_value, index) => makeRecord(`s${index}`, index));
    const { build, readTitleSnapshots } = setup({ records, titles: {} });
    const value = (await build().execute({ query: 'none' }, exec)) as { note?: string };
    expect(readTitleSnapshots.mock.calls[0]?.[0]).toHaveLength(200);
    expect(value.note).toContain('scanned the newest 200 sessions');
  });

  it('归档的主会话不因活动 subagent 而复活', async () => {
    const ctx = makeCtx();
    const { query } = makeQuery({
      records: [makeRecord('s1', 2), makeRecord('s2', 1, { parentId: 's1' })],
    });
    ctx._setService('sessionQuery', query);
    ctx._setService('workspaceRegistry', {
      get: () => undefined,
      archivedSessionIds: ['s1'],
      pinnedSessionIds: [],
    });
    const tool = buildSessionTool('session_list', { ctx, sessionQuery: query });
    const value = (await tool.execute({}, exec)) as {
      total: number;
      sessions: Array<{ id: string }>;
    };
    expect(value.total).toBe(0);
    expect(value.sessions).toEqual([]);
  });

  it('渲染数量、摘要与说明', async () => {
    const { build } = setup({
      records: [makeRecord('s1', 1, { cwd: 'D:\\a', live: true })],
      titles: { s1: '第一' },
    });
    const tool = build();
    const value = await tool.execute({}, exec);
    const [block] = tool.output.render({}, value as never);
    const text = (block as { text: string }).text;
    expect(text).toContain('1 of 1 session(s), newest first');
    expect(text).toContain('第一 — s1');
    expect(text).toContain('D:\\a');
    expect(text).toContain('live');
  });
});
