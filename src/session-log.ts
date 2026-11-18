/**
 * 会话日志导出工具：session_get。
 * 把主会话与全部后代 subagent 的规范 JSONL 写入系统临时目录，返回文件路径。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineTool } from '@deepseek-ai/dsh-tools';

import { PLUGIN_LABEL } from './constants.ts';
import type {
  Context,
  SessionHeaderLike,
  SessionLineageLike,
  SessionLineageNodeLike,
  SessionLogSnapshotLike,
  SessionQueryLike,
  SessionsServiceLike,
  ToolDefinition,
  ToolJsonValue,
} from './types.ts';

/** session_get 依赖。 */
export interface SessionLogToolDeps {
  /** 插件作用域上下文。 */
  ctx: Context;
  /** 会话查询服务。 */
  sessionQuery: SessionQueryLike;
}

/** 一个导出文件。 */
export interface SessionLogFileView {
  /** 绝对路径。 */
  path: string;
  /** 所属会话 id。 */
  sessionId: string;
  /** 主会话或 subagent。 */
  role: 'main' | 'subagent';
}

/** session_get 的结果。 */
export interface SessionLogView {
  /** 本次导出的目录。 */
  directory: string;
  /** 主会话 id。 */
  sessionId: string;
  /** 主会话文件。 */
  main: string;
  /** 全部文件。 */
  files: SessionLogFileView[];
  /** 后代会话数。 */
  subagentCount: number;
}

/** 输出 schema：一个 JSON 视图。 */
const OUTPUT = { type: 'json' } as const;

/** 把原始事件序列化为规范 JSONL：头行加每事件一行。 */
export function serializeSessionLog(header: SessionHeaderLike, events: readonly unknown[]): string {
  const head = {
    type: 'session',
    version: header.version ?? 0,
    id: header.id,
    createdAt: header.createdAt,
    ...(header.cwd === undefined ? {} : { cwd: header.cwd }),
    ...(header.parentSession === undefined ? {} : { parentSession: header.parentSession }),
    isSeeded: header.isSeeded ?? false,
    ...(header.origin === undefined ? {} : { origin: header.origin }),
    delegationDepth: header.delegationDepth ?? 0,
    ...(header.agentPreset === undefined ? {} : { agentPreset: header.agentPreset }),
  };
  const lines = [JSON.stringify(head)];
  for (const event of events) lines.push(JSON.stringify(event));
  return `${lines.join('\n')}\n`;
}

/** 规范日志文件名：版本 0 为 session.jsonl，其余为 session.vN.jsonl。 */
export function sessionLogFilename(header: SessionHeaderLike): string {
  const version = header.version ?? 0;
  return version === 0 ? 'session.jsonl' : `session.v${version}.jsonl`;
}

/** 把会话 id 变成安全的目录名片段。 */
function safeSegment(value: string): string {
  const safe = value.replace(/[^A-Za-z0-9._-]/g, '_');
  return safe === '' ? 'session' : safe.slice(0, 80);
}

/** 生成每次调用独立的临时目录。 */
function exportDirectory(sessionId: string): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  return join(
    tmpdir(),
    PLUGIN_LABEL,
    'session-logs',
    `${safeSegment(sessionId)}-${stamp}-${random}`,
  );
}

/** 展开会话树的全部后代，保持先序。 */
function flattenDescendants(
  nodes: readonly SessionLineageNodeLike[],
  out: SessionLineageNodeLike[] = [],
): SessionLineageNodeLike[] {
  for (const node of nodes) {
    out.push(node);
    flattenDescendants(node.descendants, out);
  }
  return out;
}

/** 在会话仍活动时执行落盘屏障。 */
async function flushIfLive(ctx: Context, sessionId: string): Promise<void> {
  const sessions = ctx.get('sessions') as SessionsServiceLike | undefined;
  const session = sessions?.get(sessionId);
  if (sessions === undefined || session === undefined) return;
  await sessions.flush(session);
}

/** 错误对象的可读消息。 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 读取一个会话的完整日志；不存在或读取失败时抛错。 */
async function readLog(
  sessionQuery: SessionQueryLike,
  sessionId: string,
): Promise<SessionLogSnapshotLike> {
  try {
    return await sessionQuery.readSession(sessionId);
  } catch (error) {
    throw new Error(`Could not read session '${sessionId}': ${messageOf(error)}`);
  }
}

/** session_get 的渲染：目录、主文件、subagent 文件与数量。 */
function renderSessionLog(_args: unknown, value: unknown): { type: 'text'; text: string }[] {
  const view = value as SessionLogView;
  const lines = [`exported session ${view.sessionId} to ${view.directory}`, view.main];
  for (const file of view.files) {
    if (file.role === 'subagent') lines.push(file.path);
  }
  lines.push(`${view.files.length} file(s), ${view.subagentCount} subagent session(s)`);
  return [{ type: 'text', text: lines.join('\n') }];
}

/** 构建 session_get 工具定义。 */
export function buildSessionLogTool(deps: SessionLogToolDeps): ToolDefinition {
  const { ctx, sessionQuery } = deps;
  return defineTool({
    name: 'session_get',
    description:
      'Export one session log to a temporary directory and return the written file paths. The export contains the main session and one log per subagent session. Each file is JSONL: a header line followed by one event per line. Read the returned files to inspect the session.',
    parameters: {
      session_id: {
        type: 'string',
        required: true,
        description: 'Session id from session_list.',
      },
    },
    output: { schema: OUTPUT, render: renderSessionLog },
    async execute(args) {
      const id = args.session_id.trim();
      if (id === '') throw new Error('session_id must not be empty');
      let lineage: SessionLineageLike;
      try {
        lineage = await sessionQuery.traceSession(id);
      } catch (error) {
        throw new Error(`Could not read session '${id}': ${messageOf(error)}`);
      }

      const directory = exportDirectory(id);
      const entries: Array<{
        header: SessionHeaderLike;
        events: readonly unknown[];
        sessionId: string;
        role: 'main' | 'subagent';
        filename: string;
      }> = [];
      await flushIfLive(ctx, id);
      const mainLog = await readLog(sessionQuery, id);
      entries.push({
        header: mainLog.session,
        events: mainLog.events,
        sessionId: id,
        role: 'main',
        filename: sessionLogFilename(mainLog.session),
      });
      for (const node of flattenDescendants(lineage.descendants)) {
        const childId = node.session.header.id;
        await flushIfLive(ctx, childId);
        const log = await readLog(sessionQuery, childId);
        entries.push({
          header: log.session,
          events: log.events,
          sessionId: childId,
          role: 'subagent',
          filename: sessionLogFilename(log.session),
        });
      }

      const files: SessionLogFileView[] = [];
      try {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        for (const entry of entries) {
          const target =
            entry.role === 'main'
              ? join(directory, entry.filename)
              : join(directory, 'subagents', safeSegment(entry.sessionId), entry.filename);
          if (entry.role === 'subagent') {
            await mkdir(join(directory, 'subagents', safeSegment(entry.sessionId)), {
              recursive: true,
              mode: 0o700,
            });
          }
          await writeFile(target, serializeSessionLog(entry.header, entry.events), {
            encoding: 'utf8',
            mode: 0o600,
          });
          files.push({ path: target, sessionId: entry.sessionId, role: entry.role });
        }
      } catch (error) {
        throw new Error(`Could not write session logs to '${directory}': ${messageOf(error)}`);
      }

      return {
        directory,
        sessionId: id,
        main: files[0]?.path ?? join(directory, 'session.jsonl'),
        files,
        subagentCount: files.filter((file) => file.role === 'subagent').length,
      } as unknown as ToolJsonValue;
    },
  });
}
