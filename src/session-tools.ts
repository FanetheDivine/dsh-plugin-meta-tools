/**
 * 会话工具：session_list 与 session_get。
 * 导出 buildSessionTool 与结果视图类型。
 */
import { ToolArgsError, defineTool } from '@deepseek-ai/dsh-tools';

import {
  MESSAGES_TOTAL_LIMIT,
  MESSAGE_TEXT_LIMIT,
  SESSION_TOOL_NAMES,
  TITLES_PAGE_LIMIT,
} from './constants.ts';
import type {
  Context,
  SessionQueryLike,
  SessionRecordLike,
  SessionSurfaceLike,
  ToolDefinition,
  ToolJsonValue,
  WorkspaceRegistryLike,
} from './types.ts';
import { clamp, iso, textOf } from './utils.ts';

/** 会话工具名。 */
export type SessionToolName = (typeof SESSION_TOOL_NAMES)[number];

/** 工具执行所需的上下文与服务。 */
export interface SessionToolDeps {
  /** 插件作用域上下文。 */
  ctx: Context;
  /** 会话查询服务。 */
  sessionQuery: SessionQueryLike;
}

/** 一条可见消息的 JSON 视图。 */
export interface SessionMessageView {
  role: 'user' | 'assistant';
  text: string;
  truncated?: boolean;
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

/** session_get 的结果。 */
export interface SessionView {
  id: string;
  title?: string;
  cwd?: string;
  createdAt: string;
  agentPreset?: string;
  live: boolean;
  archived: boolean;
  pinned: boolean;
  eventCount: number;
  messages?: SessionMessageView[];
}

/** 计为可见消息的事件类型。 */
const MESSAGE_EVENT_TYPES = new Set(['user/message', 'assistant/message']);

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

/** 收集当前 surface 上最新的可见用户与助手消息。 */
function tailMessages(events: SessionSurfaceLike['events'], limit: number): SessionMessageView[] {
  const picked: SessionMessageView[] = [];
  for (let index = events.length - 1; index >= 0 && picked.length < limit; index -= 1) {
    const event = events[index];
    if (event === undefined || !MESSAGE_EVENT_TYPES.has(event.type)) continue;
    const text = textOf(event.data?.content);
    if (text === '') continue;
    const role: SessionMessageView['role'] = event.type === 'user/message' ? 'user' : 'assistant';
    const truncated = text.length > MESSAGE_TEXT_LIMIT;
    picked.push({
      role,
      text: truncated ? `${text.slice(0, MESSAGE_TEXT_LIMIT)}\n… [truncated]` : text,
      ...(truncated ? { truncated: true } : {}),
    });
  }
  picked.reverse();
  let budget = MESSAGES_TOTAL_LIMIT;
  for (const message of picked) {
    if (budget <= 0) {
      message.text = '… [omitted: result budget reached]';
      continue;
    }
    budget -= message.text.length;
  }
  return picked;
}

/** 读取一页会话的标题；页长超过上限时跳过，失败结果被忽略。 */
async function titlesOf(
  sessionQuery: SessionQueryLike,
  ids: readonly string[],
  signal: AbortSignal,
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  if (ids.length === 0 || ids.length > TITLES_PAGE_LIMIT) return titles;
  const results = await sessionQuery.readTitleSnapshots(ids, signal);
  for (const result of results) {
    if (result.status === 'fulfilled' && typeof result.value?.title === 'string') {
      titles.set(result.sessionId, result.value.title);
    }
  }
  return titles;
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

/** session_get 的渲染：元数据与消息分段。 */
function renderSession(_args: unknown, value: unknown): { type: 'text'; text: string }[] {
  const session = value as SessionView;
  const lines = [
    `session ${session.id}`,
    `title: ${session.title ?? '(untitled)'}`,
    `cwd: ${session.cwd ?? '(none)'}`,
    `created: ${session.createdAt}`,
  ];
  if (session.agentPreset !== undefined) lines.push(`preset: ${session.agentPreset}`);
  const state = [session.live ? 'live' : 'stored'];
  if (session.archived) state.push('archived');
  if (session.pinned) state.push('pinned');
  lines.push(`state: ${state.join(', ')}`);
  lines.push(`events: ${session.eventCount}`);
  if (session.messages !== undefined) {
    if (session.messages.length === 0) lines.push('', '(no visible user or assistant messages)');
    for (const message of session.messages) {
      lines.push('', `--- ${message.role} ---`, message.text);
    }
  }
  return [{ type: 'text', text: lines.join('\n') }];
}

/** 构建一个会话工具定义。 */
export function buildSessionTool(name: SessionToolName, deps: SessionToolDeps): ToolDefinition {
  const { ctx, sessionQuery } = deps;

  switch (name) {
    case 'session_list':
      return defineTool({
        name: 'session_list',
        description:
          'List sessions of this DSH profile, newest first, as titles with ids and working directories. Filter with workspace_id or cwd to narrow the page. Stored titles are folded from each listed session log, so keep limit small; pass titles false to skip that read.',
        parameters: {
          workspace_id: {
            type: 'string',
            description:
              'Only sessions accounted by this workspace. Omit to list every session in the profile.',
          },
          cwd: {
            type: 'string',
            description:
              'Only sessions whose recorded working directory equals this absolute path.',
          },
          limit: {
            type: 'integer',
            description: 'Maximum sessions to return, 1-100. Defaults to 20.',
          },
          titles: {
            type: 'boolean',
            description: 'Read stored titles (default true). False is faster on large histories.',
          },
          include_archived: {
            type: 'boolean',
            description: 'Include sessions hidden from workspace grouping (default false).',
          },
        },
        output: { schema: OUTPUT, render: renderSessionList },
        async execute(args, exec) {
          const { registry, archived, pinned } = navigationState(ctx);
          let records: readonly SessionRecordLike[] = await sessionQuery.listSessions(exec.signal);
          if (args.workspace_id !== undefined) {
            if (registry === undefined) {
              throw new Error('Workspace listing is unavailable in this profile.');
            }
            const workspace = registry.get(args.workspace_id.trim());
            if (workspace === undefined) {
              throw new Error(
                `No workspace with id '${args.workspace_id}'. Call workspace_list for current ids.`,
              );
            }
            const accounted = new Set(workspace.sessionIds);
            records = records.filter((record) => accounted.has(record.header.id));
          }
          if (args.cwd !== undefined) {
            const cwd = args.cwd.trim();
            records = records.filter((record) => record.header.cwd === cwd);
          }
          if (args.include_archived !== true) {
            records = records.filter((record) => !archived.has(record.header.id));
          }
          const sorted = [...records].sort(
            (left, right) => right.header.createdAt - left.header.createdAt,
          );
          const total = sorted.length;
          const limit = clamp(args.limit, 20, 1, 100);
          const page = sorted.slice(0, limit);
          let titles = new Map<string, string>();
          let note: string | undefined;
          if (args.titles !== false) {
            try {
              titles = await titlesOf(
                sessionQuery,
                page.map((record) => record.header.id),
                exec.signal,
              );
            } catch (error) {
              if (exec.signal.aborted) throw error;
              note = `Stored titles could not be read: ${messageOf(error)}`;
            }
          }
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

    case 'session_get':
      return defineTool({
        name: 'session_get',
        description:
          'Read one session of this DSH profile by id: title, working directory, creation time, preset, event count, and optionally its latest model-visible user and assistant messages. Use session_list to find an id.',
        parameters: {
          session_id: {
            type: 'string',
            required: true,
            description: 'Session id from session_list or a workspace listing.',
          },
          messages: {
            type: 'integer',
            description:
              'How many of the newest visible user and assistant messages to include, 0-50. Defaults to 10; 0 returns metadata only.',
          },
        },
        output: { schema: OUTPUT, render: renderSession },
        async execute(args, exec) {
          const id = args.session_id.trim();
          if (id === '') throw new ToolArgsError(['session_id must not be empty']);
          let surface: SessionSurfaceLike;
          try {
            surface = await sessionQuery.readSurface(id);
          } catch (error) {
            throw new Error(`Could not read session '${id}': ${messageOf(error)}`);
          }
          let title: string | undefined;
          try {
            const [observed] = await sessionQuery.readTitleSnapshots([id], exec.signal);
            if (observed?.status === 'fulfilled' && typeof observed.value?.title === 'string') {
              title = observed.value.title;
            }
          } catch (error) {
            if (exec.signal.aborted) throw error;
          }
          const { archived, pinned } = navigationState(ctx);
          const sessions = ctx.get('sessions') as { get(id: string): unknown } | undefined;
          const live = sessions?.get(id) !== undefined;
          const header = surface.session;
          const count = surface.capturedThroughSeq === null ? 0 : surface.capturedThroughSeq + 1;
          const limit = clamp(args.messages, 10, 0, 50);
          return {
            id: header.id,
            ...(title === undefined ? {} : { title }),
            ...(header.cwd === undefined ? {} : { cwd: header.cwd }),
            createdAt: iso(header.createdAt),
            ...(header.agentPreset === undefined ? {} : { agentPreset: header.agentPreset }),
            live,
            archived: archived.has(id),
            pinned: pinned.has(id),
            eventCount: count,
            ...(limit === 0 ? {} : { messages: tailMessages(surface.events, limit) }),
          } as unknown as ToolJsonValue;
        },
      });

    default:
      throw new Error(`unknown session tool '${String(name)}'`);
  }
}