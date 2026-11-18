// 工具契约测试：六个工具的名称、说明、参数与输出 schema 与基准插件一致。
import { describe, expect, it } from 'vitest';

import { buildSessionTool } from '../src/session-tools.ts';
import type { SessionQueryLike, WorkspaceRegistryLike } from '../src/types.ts';
import { buildWorkspaceTool } from '../src/workspace-tools.ts';
import { makeCtx } from './helpers.ts';

/** 基准插件的工具说明。 */
const DESCRIPTIONS: Record<string, string> = {
  workspace_list:
    'List the workspaces (registered project directories) of this DSH profile, with their ids, titles, paths, and session counts. Start here to obtain a workspace id for the other workspace tools.',
  workspace_create:
    'Register an existing absolute directory as a workspace in this DSH profile. Idempotent: a directory that is already registered returns its existing workspace with created false. Nothing is copied, moved, or deleted on disk, and no session is created.',
  workspace_remove:
    'Remove a workspace registration from this DSH profile. The directory, its files, and every session history stay untouched; its sessions become ungrouped. Re-adding the same directory later creates a fresh workspace with an empty session list.',
  workspace_rename:
    'Change the display title of one registered workspace. Duplicate titles across workspaces are allowed; the directory path is unchanged.',
  session_list:
    'List sessions of this DSH profile, newest first, as titles with ids and working directories. Filter with workspace_id or cwd to narrow the page. Stored titles are folded from each listed session log, so keep limit small; pass titles false to skip that read.',
  session_get:
    'Read one session of this DSH profile by id: title, working directory, creation time, preset, event count, and optionally its latest model-visible user and assistant messages. Use session_list to find an id.',
};

/** 每个工具编译后的必填参数。 */
const REQUIRED: Record<string, string[] | undefined> = {
  workspace_list: undefined,
  workspace_create: ['path'],
  workspace_remove: ['workspace_id'],
  workspace_rename: ['workspace_id', 'title'],
  session_list: undefined,
  session_get: ['session_id'],
};

/** 构造六个工具定义。 */
function definitions() {
  const ctx = makeCtx();
  const registry = {} as WorkspaceRegistryLike;
  const sessionQuery = {} as SessionQueryLike;
  return {
    workspace_list: buildWorkspaceTool('workspace_list', { ctx, registry }),
    workspace_create: buildWorkspaceTool('workspace_create', { ctx, registry }),
    workspace_remove: buildWorkspaceTool('workspace_remove', { ctx, registry }),
    workspace_rename: buildWorkspaceTool('workspace_rename', { ctx, registry }),
    session_list: buildSessionTool('session_list', { ctx, sessionQuery }),
    session_get: buildSessionTool('session_get', { ctx, sessionQuery }),
  };
}

describe('工具契约', () => {
  it('名称、说明与输出 schema 与基准一致', () => {
    for (const [name, tool] of Object.entries(definitions())) {
      expect(tool.name).toBe(name);
      expect(tool.description).toBe(DESCRIPTIONS[name]);
      expect(tool.output.schema).toEqual({});
    }
  });

  it('参数根对象与必填项与基准一致', () => {
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

  it('参数类型与说明与基准一致', () => {
    const tools = definitions();
    const patch = (
      tool: { parameters: Record<string, unknown> },
      key: string,
    ): Record<string, unknown> => {
      const properties = (
        tool.parameters as { properties: Record<string, Record<string, unknown>> }
      ).properties;
      return properties[key] as Record<string, unknown>;
    };
    expect(patch(tools.workspace_create, 'path')).toMatchObject({
      type: 'string',
      description: 'Absolute path of an existing directory, for example C:\\projects\\app.',
    });
    expect(patch(tools.workspace_create, 'title')).toMatchObject({ type: 'string' });
    expect(patch(tools.workspace_remove, 'workspace_id')).toMatchObject({
      type: 'string',
      description: 'Workspace id from workspace_list.',
    });
    expect(patch(tools.workspace_rename, 'title')).toMatchObject({
      type: 'string',
      description: 'New display title.',
    });
    expect(patch(tools.session_list, 'limit')).toMatchObject({
      type: 'integer',
      description: 'Maximum sessions to return, 1-100. Defaults to 20.',
    });
    expect(patch(tools.session_list, 'titles')).toMatchObject({ type: 'boolean' });
    expect(patch(tools.session_list, 'include_archived')).toMatchObject({ type: 'boolean' });
    expect(patch(tools.session_get, 'messages')).toMatchObject({
      type: 'integer',
      description:
        'How many of the newest visible user and assistant messages to include, 0-50. Defaults to 10; 0 returns metadata only.',
    });
  });

  it('渲染只返回 text 内容块', () => {
    const tools = definitions();
    const rendered = tools.workspace_list.output.render({}, { count: 0, workspaces: [] });
    expect(rendered).toEqual([{ type: 'text', text: '0 workspaces' }]);
  });
});
