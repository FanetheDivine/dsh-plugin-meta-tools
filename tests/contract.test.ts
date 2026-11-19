// 工具契约测试：十一个工具的名称、说明、参数与输出 schema。
import { describe, expect, it } from 'vitest';
import { buildSessionLogTool } from '../src/session-log.ts';
import {
  buildSessionArchiveTool,
  buildSessionCreateTool,
  buildSessionPinTool,
  buildSessionSendTool,
  buildSessionStopTool,
} from '../src/session-ops.ts';
import { buildSessionTool } from '../src/session-tools.ts';
import type {
  SessionControllerLike,
  SessionQueryLike,
  WorkspaceRegistryLike,
} from '../src/types.ts';
import { buildWorkspaceTool } from '../src/workspace-tools.ts';
import { makeCtx } from './helpers.ts';

/** 各工具说明。 */
const DESCRIPTIONS: Record<string, string> = {
  workspace_list:
    'List the DSH (DeepSeek Harness) workspaces (project directories) with their ids, titles, paths, and session counts. Start here to obtain a workspace id for the other DSH workspace tools.',
  workspace_create:
    'Register an existing absolute directory as a DSH (DeepSeek Harness) workspace. Idempotent: a directory that is already registered returns its existing workspace with created false. Nothing is copied, moved, or deleted on disk, and no session is created.',
  workspace_remove:
    'Remove a DSH (DeepSeek Harness) workspace registration. The directory, its files, and every session history stay untouched; its sessions become ungrouped. Re-adding the same directory later creates a fresh workspace with an empty session list.',
  workspace_rename:
    'Change the display title of one registered DSH (DeepSeek Harness) workspace. Duplicate titles across workspaces are allowed; the directory path is unchanged.',
  session_list:
    "List DSH (DeepSeek Harness) sessions newest first, with ids, titles, and working directories. Filter by workspace, working directory, or a case-insensitive substring of the title. The calling session is omitted; subagent sessions appear as their main session. Stored titles are folded from session logs, so a title read can touch each listed session's log.",
  session_get:
    'Export one DSH (DeepSeek Harness) session log to a temporary directory and return the written file paths. The export contains the main session and one log per subagent session. Each file is JSONL: a header line followed by one event per line. Read the returned files to inspect the session.',
  session_create:
    'Create a DSH (DeepSeek Harness) session, optionally in a workspace or directory, with an agent preset, an optional provider/model/effort selection, a title, and a first prompt. Returns the new session id.',
  session_stop:
    'Cancel the current turn of one DSH (DeepSeek Harness) session without dropping its pending messages.',
  session_send:
    'Send one steering message to an ordinary DSH (DeepSeek Harness) session as a system reminder with source kind dsh-plugin-meta-tools. The text is wrapped in a <system-reminder> frame, and a closing tag inside the text is escaped. Running sessions receive it at the nearest step; idle sessions start a turn.',
  session_pin:
    'Pin a DSH (DeepSeek Harness) session to the top of its list, or remove the pin. A pinned session must exist and must not be archived.',
  session_archive:
    'Archive a DSH (DeepSeek Harness) session so it leaves the normal list, or restore an archived session. Archiving keeps the directory and every session log. A session with running work is refused unless stop_activity is true.',
};

/** 每个工具编译后的必填参数。 */
const REQUIRED: Record<string, string[] | undefined> = {
  workspace_list: undefined,
  workspace_create: ['path'],
  workspace_remove: ['workspace_id'],
  workspace_rename: ['workspace_id', 'title'],
  session_list: undefined,
  session_get: ['session_id'],
  session_create: undefined,
  session_stop: ['session_id'],
  session_send: ['session_id', 'text'],
  session_pin: ['session_id'],
  session_archive: ['session_id'],
};

/** 构造十一个工具定义。 */
function definitions() {
  const ctx = makeCtx();
  const registry = {} as WorkspaceRegistryLike;
  const sessionQuery = {} as SessionQueryLike;
  const sessionController = {} as SessionControllerLike;
  return {
    workspace_list: buildWorkspaceTool('workspace_list', { ctx, registry }),
    workspace_create: buildWorkspaceTool('workspace_create', { ctx, registry }),
    workspace_remove: buildWorkspaceTool('workspace_remove', { ctx, registry }),
    workspace_rename: buildWorkspaceTool('workspace_rename', { ctx, registry }),
    session_list: buildSessionTool('session_list', { ctx, sessionQuery }),
    session_get: buildSessionLogTool({ ctx, sessionQuery }),
    session_create: buildSessionCreateTool({ sessionController }),
    session_stop: buildSessionStopTool({ sessionController }),
    session_send: buildSessionSendTool({ sessionController }),
    session_pin: buildSessionPinTool({ registry }),
    session_archive: buildSessionArchiveTool({ registry }),
  };
}

/** 取一个参数的编译结果。 */
function property(tool: { parameters: Record<string, unknown> }, key: string) {
  const properties = (tool.parameters as { properties: Record<string, Record<string, unknown>> })
    .properties;
  return properties[key] as Record<string, unknown>;
}

describe('工具契约', () => {
  it('名称、说明与输出 schema 一致', () => {
    for (const [name, tool] of Object.entries(definitions())) {
      expect(tool.name).toBe(name);
      expect(tool.description).toBe(DESCRIPTIONS[name]);
      expect(tool.output.schema).toEqual({});
    }
  });

  it('参数根对象与必填项一致', () => {
    for (const [name, tool] of Object.entries(definitions())) {
      const parameters = tool.parameters as {
        type: string;
        properties: Record<string, unknown>;
        required?: string[];
      };
      expect(parameters.type).toBe('object');
      expect(parameters.required).toEqual(REQUIRED[name]);
    }
  });

  it('关键参数类型、枚举与说明', () => {
    const tools = definitions();
    expect(property(tools.workspace_create, 'path')).toMatchObject({
      type: 'string',
      description: 'Absolute path of an existing directory, for example C:\\projects\\app.',
    });
    expect(property(tools.session_list, 'query')).toMatchObject({ type: 'string' });
    expect(property(tools.session_list, 'limit')).toMatchObject({
      type: 'integer',
      description: 'Maximum sessions to return, 1-100. Defaults to 20.',
    });
    expect(property(tools.session_get, 'session_id')).toMatchObject({ type: 'string' });
    expect(property(tools.session_create, 'cwd')).toMatchObject({ type: 'string' });
    expect(property(tools.session_create, 'provider')).toMatchObject({
      type: 'string',
      description: 'Provider id. Required together with model when selecting a model.',
    });
    expect(property(tools.session_create, 'model')).toMatchObject({
      type: 'string',
      description: 'Model id. Required together with provider when selecting a model.',
    });
    expect(property(tools.session_create, 'effort')).toMatchObject({
      type: 'string',
      description:
        'Reasoning effort id for the exact provider/model. Requires provider and model. Omit to use the model default.',
    });
    expect(property(tools.session_send, 'mode')).toBeUndefined();
    expect(
      Object.keys(
        (tools.session_send.parameters as { properties: Record<string, unknown> }).properties,
      ),
    ).toEqual(['session_id', 'text']);
    expect(property(tools.session_send, 'text')).toMatchObject({
      type: 'string',
      description: 'Reminder text; wrapped in a system-reminder frame.',
    });
    expect(property(tools.session_archive, 'stop_activity')).toMatchObject({ type: 'boolean' });
    expect(property(tools.session_pin, 'remove')).toMatchObject({ type: 'boolean' });
  });

  it('说明与参数文案不含 profile', () => {
    for (const [_name, tool] of Object.entries(definitions())) {
      expect(tool.description.toLowerCase()).not.toContain('profile');
      const properties = (tool.parameters as { properties?: Record<string, unknown> }).properties;
      for (const parameter of Object.values(properties ?? {})) {
        expect(JSON.stringify(parameter).toLowerCase()).not.toContain('profile');
      }
    }
  });

  it('渲染只返回 text 内容块', () => {
    const tools = definitions();
    const rendered = tools.workspace_list.output.render({}, { count: 0, workspaces: [] });
    expect(rendered).toEqual([{ type: 'text', text: '0 workspaces' }]);
  });
});
