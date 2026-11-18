// 会话日志导出测试：主会话与 subagent 文件、JSONL 内容、错误与落盘屏障。
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSessionLogTool, sessionLogFilename } from '../src/session-log.ts';
import type {
  SessionHeaderLike,
  SessionLineageLike,
  SessionLineageNodeLike,
  SessionLogSnapshotLike,
  SessionQueryLike,
  SessionRecordLike,
} from '../src/types.ts';
import { makeCtx } from './helpers.ts';

/** 已创建的临时目录，测试结束后删除。 */
const directories: string[] = [];

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

/** 构造一个会话记录。 */
function makeRecord(id: string, parentId?: string): SessionRecordLike {
  return {
    header: {
      id,
      createdAt: 1,
      ...(parentId === undefined ? {} : { parentSession: parentId }),
    },
    live: false,
    persisted: true,
  };
}

/** 构造一份日志。 */
function makeLog(id: string, options: { version?: number; parentId?: string } = {}) {
  const header: SessionHeaderLike = {
    id,
    version: options.version ?? 2,
    createdAt: 1000,
    cwd: 'D:\\app',
    ...(options.parentId === undefined ? {} : { parentSession: options.parentId }),
    isSeeded: false,
    delegationDepth: options.parentId === undefined ? 0 : 1,
  };
  const log: SessionLogSnapshotLike = {
    session: header,
    events: [
      { seq: 0, type: 'session/start' },
      { seq: 1, type: 'user/message', data: { content: [{ type: 'text', text: 'hi' }] } },
    ],
  };
  return log;
}

/** 构造会话树与日志查询。 */
function makeQuery(options: {
  logs: Record<string, ReturnType<typeof makeLog>>;
  tree?: Record<string, string[]>;
}) {
  const readSession = vi.fn(async (id: string) => {
    const log = options.logs[id];
    if (log === undefined) throw new Error(`no such session: ${id}`);
    return log;
  });
  const traceSession = vi.fn(async (id: string): Promise<SessionLineageLike> => {
    if (options.logs[id] === undefined) throw new Error(`no such session: ${id}`);
    /** 递归构造后代。 */
    const buildNode = (childId: string, parentId: string): SessionLineageNodeLike => {
      const children = options.tree?.[childId] ?? [];
      return {
        session: makeRecord(childId, parentId),
        descendants: children.map((child) => buildNode(child, childId)),
      };
    };
    return {
      target: makeRecord(id),
      descendants: (options.tree?.[id] ?? []).map((child) => buildNode(child, id)),
    };
  });
  const query: SessionQueryLike = {
    listSessions: vi.fn(async () => []),
    readTitleSnapshots: vi.fn(async () => []),
    readSession,
    traceSession,
  };
  return { query, readSession, traceSession };
}

/** 构造工具。 */
function setup(options: Parameters<typeof makeQuery>[0]) {
  const ctx = makeCtx();
  const { query, readSession, traceSession } = makeQuery(options);
  return {
    ctx,
    query,
    readSession,
    traceSession,
    tool: buildSessionLogTool({ ctx, sessionQuery: query }),
  };
}

/** 工具执行上下文桩。 */
const exec = { signal: new AbortController().signal } as never;

describe('session_get', () => {
  it('把主会话与两层 subagent 写成独立 JSONL 文件', async () => {
    const { tool } = setup({
      logs: {
        main: makeLog('main'),
        child: makeLog('child', { parentId: 'main' }),
        grand: makeLog('grand', { parentId: 'child' }),
      },
      tree: { main: ['child'], child: ['grand'] },
    });
    const value = (await tool.execute({ session_id: 'main' }, exec)) as {
      directory: string;
      main: string;
      files: Array<{ path: string; sessionId: string; role: string }>;
      subagentCount: number;
    };
    directories.push(value.directory);
    expect(value.files).toHaveLength(3);
    expect(value.subagentCount).toBe(2);
    expect(value.main.endsWith(sessionLogFilename(makeLog('main').session))).toBe(true);
    expect(value.files[1]?.path).toContain(join('subagents', 'child'));
    expect(value.files[2]?.path).toContain(join('subagents', 'grand'));

    const text = await readFile(value.main, 'utf8');
    const lines = text.trimEnd().split('\n');
    const head = JSON.parse(lines[0] as string) as Record<string, unknown>;
    expect(head).toMatchObject({ type: 'session', id: 'main', version: 2, cwd: 'D:\\app' });
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[1] as string)).toMatchObject({ seq: 0, type: 'session/start' });
  });

  it('没有 subagent 时只写主会话文件', async () => {
    const { tool } = setup({ logs: { main: makeLog('main', { version: 0 }) }, tree: {} });
    const value = (await tool.execute({ session_id: 'main' }, exec)) as {
      directory: string;
      files: unknown[];
      main: string;
    };
    directories.push(value.directory);
    expect(value.files).toHaveLength(1);
    expect(value.main.endsWith('session.jsonl')).toBe(true);
  });

  it('活动会话在读取前执行落盘屏障', async () => {
    const { ctx, tool } = setup({ logs: { main: makeLog('main') }, tree: {} });
    const flush = vi.fn(async () => true);
    ctx._setService('sessions', {
      get: (id: string) => (id === 'main' ? { id } : undefined),
      flush,
    });
    const value = (await tool.execute({ session_id: 'main' }, exec)) as { directory: string };
    directories.push(value.directory);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('未知会话报错且不创建目录', async () => {
    const { tool } = setup({ logs: {}, tree: {} });
    await expect(tool.execute({ session_id: 'nope' }, exec)).rejects.toThrow(
      "Could not read session 'nope'",
    );
  });

  it('空 id 报错', async () => {
    const { tool } = setup({ logs: {}, tree: {} });
    await expect(tool.execute({ session_id: ' ' }, exec)).rejects.toThrow(
      'session_id must not be empty',
    );
  });

  it('每次调用使用独立目录', async () => {
    const { tool } = setup({ logs: { main: makeLog('main') }, tree: {} });
    const first = (await tool.execute({ session_id: 'main' }, exec)) as { directory: string };
    const second = (await tool.execute({ session_id: 'main' }, exec)) as { directory: string };
    directories.push(first.directory, second.directory);
    expect(first.directory).not.toBe(second.directory);
  });

  it('渲染目录、主文件与数量', async () => {
    const { tool } = setup({ logs: { main: makeLog('main') }, tree: {} });
    const value = await tool.execute({ session_id: 'main' }, exec);
    directories.push((value as { directory: string }).directory);
    const [block] = tool.output.render({}, value as never);
    const text = (block as { text: string }).text;
    expect(text).toContain('exported session main');
    expect(text).toContain('1 file(s), 0 subagent session(s)');
  });
});
