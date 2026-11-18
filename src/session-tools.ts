/**
 * 会话列表工具：session_list。
 * 按工作区、目录或标题查询会话；排除调用方会话；subagent 归并到主会话。
 */
import { defineTool } from '@deepseek-ai/dsh-tools';

import { TITLE_SCAN_LIMIT } from './constants.ts';
import type {
  Context,
  SessionQueryLike,
  SessionRecordLike,
  ToolDefinition,
  ToolJsonValue,
  WorkspaceRegistryLike,
} from './types.ts';
import { clamp, iso } from './utils.ts';

/** 会话读取工具依赖。 */
export interface SessionToolDeps {
  /** 插件作用域上下文。 */
  ctx: Context;
  /** 会话查询服务。 */
  sessionQuery: SessionQueryLike;
}

/** session_list 的单条会话摘要。 */
export interface SessionSummaryView {
  id: string;
  title?: string;
  cwd?: string;
  createdAt: string;
  live: boolean;
  archived: boolean;
  pinned: boolean;
}

/** session_list 的结果。 */
export interface SessionListView {
  total: number;
  returned: number;
  note?: string;
  sessions: SessionSummaryView[];
}

/** 输出 schema：一个 JSON 视图。 */
const OUTPUT = { type: 'json' } as const;

/** 取归档与固定会话集合；注册表不在时为空集合。 */
function navigationState(ctx: Context): {
  registry: WorkspaceRegistryLike | undefined;
  archived: Set<string>;
  pinned: Set<string>;
} {
  const registry = ctx.get('workspaceRegistry') as WorkspaceRegistryLike | undefined;
  return {
    registry,
    archived: new Set(registry?.archivedSessionIds ?? []),
    pinned: new Set(registry?.pinnedSessionIds ?? []),
  };
}

/** 沿父链找到记录所属的主会话；父链断开时停在最高已知记录。 */
function rootOf(
  record: SessionRecordLike,
  byId: ReadonlyMap<string, SessionRecordLike>,
): SessionRecordLike {
  let current = record;
  const seen = new Set<string>();
  for (;;) {
    const parentId = current.header.parentSession?.id;
    if (parentId === undefined || seen.has(current.header.id)) return current;
    seen.add(current.header.id);
    const parent = byId.get(parentId);
    if (parent === undefined) return current;
    current = parent;
  }
}

/** 把记录按主会话归并，保持主会话 id 到记录的映射。 */
function groupByRoot(
  records: readonly SessionRecordLike[],
  byId: ReadonlyMap<string, SessionRecordLike>,
): Map<string, SessionRecordLike> {
  const roots = new Map<string, SessionRecordLike>();
  for (const record of records) {
    const root = rootOf(record, byId);
    roots.set(root.header.id, root);
  }
  return roots;
}

/** 批量折叠标题；整批失败变成说明文字。 */
async function readTitles(
  sessionQuery: SessionQueryLike,
  ids: readonly string[],
  signal: AbortSignal,
): Promise<{ titles: Map<string, string>; note?: string }> {
  const titles = new Map<string, string>();
  if (ids.length === 0) return { titles };
  try {
    const results = await sessionQuery.readTitleSnapshots(ids, signal);
    for (const result of results) {
      if (result.status === 'fulfilled' && typeof result.value?.title === 'string') {
        titles.set(result.sessionId, result.value.title);
      }
    }
    return { titles };
  } catch (error) {
    if (signal.aborted) throw error;
    return {
      titles,
      note: `Stored titles could not be read: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** 错误对象的可读消息。 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** session_list 的渲染：数量、逐项摘要与可选说明。 */
function renderSessionList(_args: unknown, value: unknown): { type: 'text'; text: string }[] {
  const list = value as SessionListView;
  const lines = [`${list.returned} of ${list.total} session(s), newest first`];
  for (const session of list.sessions) {
    lines.push(`${session.title ?? '(untitled)'} — ${session.id}`);
    const details: string[] = [];
    if (session.cwd !== undefined) details.push(session.cwd);
    details.push(`created ${session.createdAt}`);
    details.push(session.live ? 'live' : 'stored');
    if (session.archived) details.push('archived');
    if (session.pinned) details.push('pinned');
    lines.push(`  ${details.join(' · ')}`);
  }
  if (list.note !== undefined) lines.push(list.note);
  return [{ type: 'text', text: lines.join('\n') }];
}

/** 构建 session_list 工具定义。 */
export function buildSessionTool(name: 'session_list', deps: SessionToolDeps): ToolDefinition {
  const { ctx, sessionQuery } = deps;
  if (name !== 'session_list') throw new Error(`unknown session tool '${String(name)}'`);

  return defineTool({
    name: 'session_list',
    description:
      "List sessions newest first, with ids, titles, and working directories. Filter by workspace, working directory, or a case-insensitive substring of the title. The calling session is omitted; subagent sessions appear as their main session. Stored titles are folded from session logs, so a title read can touch each listed session's log.",
    parameters: {
      workspace_id: {
        type: 'string',
        description: 'Only sessions accounted by this workspace. Omit to list every session.',
      },
      cwd: {
        type: 'string',
        description: 'Only sessions whose recorded working directory equals this absolute path.',
      },
      query: {
        type: 'string',
        description: 'Case-insensitive substring of the stored title. Omit to list every session.',
      },
      limit: {
        type: 'integer',
        description: 'Maximum sessions to return, 1-100. Defaults to 20.',
      },
      titles: {
        type: 'boolean',
        description: 'Read stored titles (default true). Always read when query is given.',
      },
      include_archived: {
        type: 'boolean',
        description: 'Include archived sessions (default false).',
      },
    },
    output: { schema: OUTPUT, render: renderSessionList },
    async execute(args, exec) {
      const { registry, archived, pinned } = navigationState(ctx);
      const all = await sessionQuery.listSessions(exec.signal);
      const byId = new Map(all.map((record) => [record.header.id, record]));

      const callerId = exec.agent?.session.id;
      let callerRootId: string | undefined;
      if (callerId !== undefined) {
        const caller = byId.get(callerId) ?? {
          header: { id: callerId, createdAt: 0 },
          live: true,
          persisted: false,
        };
        callerRootId = rootOf(caller, byId).header.id;
      }

      const roots = groupByRoot(all, byId);
      let candidates = [...roots.values()].filter((root) => root.header.id !== callerRootId);
      if (args.workspace_id !== undefined) {
        if (registry === undefined) {
          throw new Error('Workspace listing is unavailable.');
        }
        const workspace = registry.get(args.workspace_id.trim());
        if (workspace === undefined) {
          throw new Error(
            `No workspace with id '${args.workspace_id}'. Call workspace_list for current ids.`,
          );
        }
        const accounted = new Set(workspace.sessionIds);
        candidates = candidates.filter((root) => accounted.has(root.header.id));
      }
      if (args.cwd !== undefined) {
        const cwd = args.cwd.trim();
        candidates = candidates.filter((root) => root.header.cwd === cwd);
      }
      if (args.include_archived !== true) {
        candidates = candidates.filter((root) => !archived.has(root.header.id));
      }
      candidates.sort((left, right) => right.header.createdAt - left.header.createdAt);

      const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
      const wantsTitles = args.titles !== false || query !== '';
      let note: string | undefined;
      let titles = new Map<string, string>();
      let matched = candidates;

      if (query !== '') {
        const scanned = candidates.slice(0, TITLE_SCAN_LIMIT);
        if (candidates.length > TITLE_SCAN_LIMIT) {
          note = `Title matching scanned the newest ${TITLE_SCAN_LIMIT} sessions; add workspace_id or cwd to narrow the scan.`;
        }
        const reading = await readTitles(
          sessionQuery,
          scanned.map((root) => root.header.id),
          exec.signal,
        );
        titles = reading.titles;
        if (reading.note !== undefined)
          note = note === undefined ? reading.note : `${note} ${reading.note}`;
        matched = scanned.filter((root) => {
          const title = titles.get(root.header.id);
          return title !== undefined && title.toLowerCase().includes(query);
        });
      } else if (wantsTitles) {
        const page = candidates.slice(0, clamp(args.limit, 20, 1, 100));
        const reading = await readTitles(
          sessionQuery,
          page.map((root) => root.header.id),
          exec.signal,
        );
        titles = reading.titles;
        note = reading.note;
      }

      const total = matched.length;
      const limit = clamp(args.limit, 20, 1, 100);
      const page = matched.slice(0, limit);
      return {
        total,
        returned: page.length,
        ...(note === undefined ? {} : { note }),
        sessions: page.map((record) => ({
          id: record.header.id,
          ...(titles.has(record.header.id) ? { title: titles.get(record.header.id) } : {}),
          ...(record.header.cwd === undefined ? {} : { cwd: record.header.cwd }),
          createdAt: iso(record.header.createdAt),
          live: record.live,
          archived: archived.has(record.header.id),
          pinned: pinned.has(record.header.id),
        })),
      } as unknown as ToolJsonValue;
    },
  });
}

/** 错误消息工具：供其他模块复用。 */
export { messageOf };
