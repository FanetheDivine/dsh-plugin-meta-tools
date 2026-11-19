/**
 * 会话操作工具：session_create、session_stop、session_send、session_pin 与 session_archive。
 * 新建与解析走 sessionController，插件消息走 Agent.steer，置顶与归档走 workspaceRegistry。
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { defineTool, ToolArgsError } from '@deepseek-ai/dsh-tools';

import { PLUGIN_LABEL } from './constants.ts';

import type {
  Agent,
  SessionControllerLike,
  SubagentsLike,
  TextContentBlockLike,
  ToolDefinition,
  ToolJsonValue,
  WorkspaceRegistryLike,
} from './types.ts';

/** 会话控制工具依赖。 */
export interface SessionControlDeps {
  /** 会话控制服务。 */
  sessionController: SessionControllerLike;
}

/** 会话导航工具依赖。 */
export interface SessionNavigationDeps {
  /** 工作区注册表。 */
  registry: WorkspaceRegistryLike;
}

/** session_create 的结果。 */
export interface SessionCreateView {
  sessionId: string;
  agentPreset?: string;
  title?: string;
  prompted: boolean;
}

/** session_stop 的结果。 */
export interface SessionStopView {
  accepted: true;
  sessionId: string;
}

/** session_send 的结果。 */
export interface SessionSendView {
  delivered: true;
  sessionId: string;
}

/** session_pin 的结果。 */
export interface SessionPinView {
  pinned: boolean;
  sessionId: string;
}

/** session_archive 的结果。 */
export interface SessionArchiveView {
  archived: boolean;
  sessionId: string;
}

/** 输出 schema：一个 JSON 视图。 */
const OUTPUT = { type: 'json' } as const;

/** 错误对象的可读消息。 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 把文本包进 system-reminder 帧，并转义正文里的闭合标签。 */
export function systemReminder(text: string): string {
  const escaped = text.trim().replaceAll('</system-reminder>', '<\\/system-reminder>');
  return `<system-reminder>\n${escaped}\n</system-reminder>`;
}

/** 以当前插件为来源，向普通会话的最近步骤投递一条消息。 */
async function steerPluginMessage(
  sessionController: SessionControllerLike,
  sessionId: string,
  content: readonly TextContentBlockLike[],
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const resolved = await sessionController.resolveAgent(sessionId);
  signal.throwIfAborted();
  if ('error' in resolved) throw resolved.error;
  resolved.agent.steer(
    createUserMessage({
      content,
      source: { kind: PLUGIN_LABEL },
    }),
  );
}

/** 宿主把 subagent 会话交给独立的子代理路由。 */
function isSubagentRouting(error: unknown): boolean {
  return messageOf(error).toLowerCase().includes('subagent routing');
}

/** 从调用方 Agent 的上下文读取可选的子代理路由服务。 */
function subagentsOf(agent: Agent | undefined): SubagentsLike | undefined {
  return agent?.ctx.get('subagents') as SubagentsLike | undefined;
}

/** 渲染单个会话操作结果。 */
function renderOne(verb: string, id: string): { type: 'text'; text: string }[] {
  return [{ type: 'text', text: `${verb} ${id}` }];
}

/** 构建新建会话工具。 */
export function buildSessionCreateTool(deps: SessionControlDeps): ToolDefinition {
  const { sessionController } = deps;
  return defineTool({
    name: 'session_create',
    description:
      'Create a session, optionally in a workspace or directory, with an agent preset, a title, and a first prompt. Returns the new session id.',
    parameters: {
      workspace_id: {
        type: 'string',
        description:
          "Workspace the session joins. Exclusive with cwd; defaults to the calling session's working directory.",
      },
      cwd: {
        type: 'string',
        description: 'Absolute directory the session owns. Exclusive with workspace_id.',
      },
      agent_preset: {
        type: 'string',
        description: 'Agent preset the session runs. Defaults to the deployment default.',
      },
      title: { type: 'string', description: 'Display title for the new session.' },
      prompt: {
        type: 'string',
        description: 'First message sent after creation. Omit to create a blank session.',
      },
    },
    output: {
      schema: OUTPUT,
      render: (_args, value) => {
        const view = value as unknown as SessionCreateView;
        return [
          {
            type: 'text',
            text: `created session ${view.sessionId}${view.prompted ? ' (prompted)' : ''}`,
          },
        ];
      },
    },
    async execute(args, exec) {
      const workspaceId = typeof args.workspace_id === 'string' ? args.workspace_id.trim() : '';
      const cwd = typeof args.cwd === 'string' ? args.cwd.trim() : '';
      if (workspaceId !== '' && cwd !== '') {
        throw new ToolArgsError(['workspace_id and cwd are mutually exclusive']);
      }
      const agentPreset = typeof args.agent_preset === 'string' ? args.agent_preset.trim() : '';

      const fallbackCwd = exec.agent?.session.header.cwd;
      const directory = cwd === '' ? (workspaceId === '' ? fallbackCwd : undefined) : cwd;
      let created: { sessionId: string; agentPreset?: string };
      try {
        created = await sessionController.create({
          ...(workspaceId === '' ? {} : { workspaceId }),
          ...(directory === undefined ? {} : { cwd: directory }),
          ...(agentPreset === '' ? {} : { agentPreset }),
        });
      } catch (error) {
        throw new Error(`Could not create the session: ${messageOf(error)}`);
      }

      let title: string | undefined;
      const requestedTitle = typeof args.title === 'string' ? args.title.trim() : '';
      if (requestedTitle !== '') {
        try {
          const renamed = await sessionController.rename({
            sessionId: created.sessionId,
            title: requestedTitle,
          });
          title = renamed.title;
        } catch (error) {
          throw new Error(
            `The session '${created.sessionId}' was created, but its title failed: ${messageOf(error)}`,
          );
        }
      }

      let prompted = false;
      const prompt = typeof args.prompt === 'string' ? args.prompt.trim() : '';
      if (prompt !== '') {
        try {
          await steerPluginMessage(
            sessionController,
            created.sessionId,
            [{ type: 'text', text: prompt }],
            exec.signal,
          );
          prompted = true;
        } catch (error) {
          throw new Error(
            `The session '${created.sessionId}' was created, but its first prompt failed: ${messageOf(error)}`,
          );
        }
      }

      return {
        sessionId: created.sessionId,
        ...(created.agentPreset === undefined ? {} : { agentPreset: created.agentPreset }),
        ...(title === undefined ? {} : { title }),
        prompted,
      } as unknown as ToolJsonValue;
    },
  });
}

/** 构建停止会话工具。 */
export function buildSessionStopTool(deps: SessionControlDeps): ToolDefinition {
  const { sessionController } = deps;
  return defineTool({
    name: 'session_stop',
    description: 'Cancel the current turn of one session without dropping its pending messages.',
    parameters: {
      session_id: {
        type: 'string',
        required: true,
        description: 'Session whose current turn to cancel.',
      },
    },
    output: {
      schema: OUTPUT,
      render: (_args, value) =>
        renderOne('stop requested for session', (value as unknown as SessionStopView).sessionId),
    },
    async execute(args, exec) {
      const id = args.session_id.trim();
      try {
        await sessionController.cancel({ sessionId: id });
      } catch (error) {
        const sender = exec.agent;
        const subagents = subagentsOf(sender);
        if (isSubagentRouting(error) && sender !== undefined && subagents !== undefined) {
          try {
            subagents.interrupt(id, { kind: 'ancestor', agent: sender });
            return { accepted: true, sessionId: id } as unknown as ToolJsonValue;
          } catch (interruptError) {
            throw new Error(`Could not stop session '${id}': ${messageOf(interruptError)}`);
          }
        }
        throw new Error(`Could not stop session '${id}': ${messageOf(error)}`);
      }
      return { accepted: true, sessionId: id } as unknown as ToolJsonValue;
    },
  });
}

/** 构建发送提醒工具。 */
export function buildSessionSendTool(deps: SessionControlDeps): ToolDefinition {
  const { sessionController } = deps;
  return defineTool({
    name: 'session_send',
    description:
      'Send one steering message to an ordinary session as a system reminder with source kind dsh-plugin-meta-tools. The text is wrapped in a <system-reminder> frame, and a closing tag inside the text is escaped. Running sessions receive it at the nearest step; idle sessions start a turn.',
    parameters: {
      session_id: {
        type: 'string',
        required: true,
        description: 'Session that receives the reminder.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'Reminder text; wrapped in a system-reminder frame.',
      },
    },
    output: {
      schema: OUTPUT,
      render: (_args, value) =>
        renderOne(
          'system reminder delivered to session',
          (value as unknown as SessionSendView).sessionId,
        ),
    },
    async execute(args, exec) {
      const id = args.session_id.trim();
      const text = args.text.trim();
      if (text === '') throw new ToolArgsError(['text must not be empty']);
      const content = [{ type: 'text' as const, text: systemReminder(text) }];
      try {
        await steerPluginMessage(sessionController, id, content, exec.signal);
      } catch (error) {
        throw new Error(`Could not deliver the reminder to session '${id}': ${messageOf(error)}`);
      }
      return { delivered: true, sessionId: id } as unknown as ToolJsonValue;
    },
  });
}

/** 构建置顶会话工具。 */
export function buildSessionPinTool(deps: SessionNavigationDeps): ToolDefinition {
  const { registry } = deps;
  return defineTool({
    name: 'session_pin',
    description:
      'Pin a session to the top of its list, or remove the pin. A pinned session must exist and must not be archived.',
    parameters: {
      session_id: { type: 'string', required: true, description: 'Session to pin or unpin.' },
      remove: {
        type: 'boolean',
        description: 'Remove the pin instead of adding it. Defaults to false.',
      },
    },
    output: {
      schema: OUTPUT,
      render: (_args, value) => {
        const view = value as unknown as SessionPinView;
        return renderOne(`${view.pinned ? 'session pinned' : 'session unpinned'}`, view.sessionId);
      },
    },
    async execute(args) {
      const id = args.session_id.trim();
      const remove = args.remove === true;
      try {
        if (remove) await registry.unpinSession(id);
        else await registry.pinSession(id);
      } catch (error) {
        throw new Error(
          `Could not ${remove ? 'unpin' : 'pin'} session '${id}': ${messageOf(error)}`,
        );
      }
      return { pinned: !remove, sessionId: id } as unknown as ToolJsonValue;
    },
  });
}

/** 构建归档会话工具。 */
export function buildSessionArchiveTool(deps: SessionNavigationDeps): ToolDefinition {
  const { registry } = deps;
  return defineTool({
    name: 'session_archive',
    description:
      'Archive a session so it leaves the normal list, or restore an archived session. Archiving keeps the directory and every session log. A session with running work is refused unless stop_activity is true.',
    parameters: {
      session_id: { type: 'string', required: true, description: 'Session to archive or restore.' },
      remove: {
        type: 'boolean',
        description:
          'Restore the session from the archive instead of archiving it. Defaults to false.',
      },
      stop_activity: {
        type: 'boolean',
        description: "Stop the session's running work before archiving. Defaults to false.",
      },
    },
    output: {
      schema: OUTPUT,
      render: (_args, value) => {
        const view = value as unknown as SessionArchiveView;
        return renderOne(view.archived ? 'session archived' : 'session restored', view.sessionId);
      },
    },
    async execute(args) {
      const id = args.session_id.trim();
      const remove = args.remove === true;
      try {
        if (remove) await registry.unarchiveSession(id);
        else
          await registry.archiveSession(id, {
            ...(args.stop_activity === true ? { stopActivity: true } : {}),
          });
      } catch (error) {
        const detail = messageOf(error);
        const base = `Could not ${remove ? 'restore' : 'archive'} session '${id}': ${detail}`;
        const lower = detail.toLowerCase();
        const hint =
          !remove && (lower.includes('active') || lower.includes('running'))
            ? ' Stop the session first, or pass stop_activity: true.'
            : '';
        throw new Error(hint === '' ? base : `${base}${base.endsWith('.') ? '' : '.'}${hint}`);
      }
      return { archived: !remove, sessionId: id } as unknown as ToolJsonValue;
    },
  });
}
