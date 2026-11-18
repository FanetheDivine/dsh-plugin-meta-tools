/**
 * 工作区工具：workspace_list、workspace_create、workspace_remove 与 workspace_rename。
 * 导出 buildWorkspaceTool 与结果视图类型。
 */
import { isAbsolute } from 'node:path';

import { defineTool, ToolArgsError } from '@deepseek-ai/dsh-tools';

import type { WORKSPACE_TOOL_NAMES } from './constants.ts';
import type {
  Context,
  ToolDefinition,
  ToolJsonValue,
  WorkspaceLike,
  WorkspaceRegistryLike,
} from './types.ts';

/** 工作区工具名。 */
export type WorkspaceToolName = (typeof WORKSPACE_TOOL_NAMES)[number];

/** 工具执行所需的上下文与服务。 */
export interface WorkspaceToolDeps {
  /** 插件作用域上下文。 */
  ctx: Context;
  /** 工作区注册表。 */
  registry: WorkspaceRegistryLike;
}

/** 单个工作区的 JSON 视图。 */
export interface WorkspaceView {
  id: string;
  title: string;
  path: string;
  status: 'ok' | 'missing-dir';
  sessionCount: number;
  archivedSessionCount: number;
  pinnedSessionCount: number;
  createdAt: string;
  updatedAt: string;
}

/** workspace_list 的结果。 */
export interface WorkspaceListView {
  count: number;
  workspaces: WorkspaceView[];
}

/** workspace_create 的结果。 */
export interface WorkspaceCreateView {
  created: boolean;
  workspace: WorkspaceView;
  note?: string;
}

/** workspace_rename 的结果。 */
export interface WorkspaceRenameView {
  workspace: WorkspaceView;
}

/** workspace_remove 的结果。 */
export interface WorkspaceRemoveView {
  removed: boolean;
  removedId: string;
  path: string;
}

/** 输出 schema：一个 JSON 视图。 */
const OUTPUT = { type: 'json' } as const;

/** 取归档与固定会话集合；注册表不在时为空集合。 */
function navigationState(ctx: Context): { archived: Set<string>; pinned: Set<string> } {
  const registry = ctx.get('workspaceRegistry') as WorkspaceRegistryLike | undefined;
  return {
    archived: new Set(registry?.archivedSessionIds ?? []),
    pinned: new Set(registry?.pinnedSessionIds ?? []),
  };
}

/** 把工作区记录投影成工具视图，含实时目录检查。 */
async function workspaceView(
  workspace: WorkspaceLike,
  archived: Set<string>,
  pinned: Set<string>,
): Promise<WorkspaceView> {
  const sessionIds = workspace.sessionIds;
  return {
    id: workspace.id,
    title: workspace.title,
    path: workspace.path,
    status: await workspace.status(),
    sessionCount: sessionIds.length,
    archivedSessionCount: sessionIds.filter((id) => archived.has(id)).length,
    pinnedSessionCount: sessionIds.filter((id) => pinned.has(id)).length,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

/** 错误对象的可读消息。 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** workspace_list 的渲染：数量与逐项明细。 */
function renderWorkspaceList(_args: unknown, value: unknown): { type: 'text'; text: string }[] {
  const list = value as WorkspaceListView;
  const lines = [`${list.count} workspace${list.count === 1 ? '' : 's'}`];
  for (const workspace of list.workspaces) {
    lines.push(`${workspace.title} — ${workspace.path}`);
    const details = [`id: ${workspace.id}`, `${workspace.sessionCount} session(s)`];
    if (workspace.archivedSessionCount > 0)
      details.push(`${workspace.archivedSessionCount} archived`);
    if (workspace.pinnedSessionCount > 0) details.push(`${workspace.pinnedSessionCount} pinned`);
    if (workspace.status === 'missing-dir') details.push('directory missing');
    lines.push(`  ${details.join(' · ')}`);
  }
  return [{ type: 'text', text: lines.join('\n') }];
}

/** 单个工作区的渲染：动词、路径、id 与可选说明。 */
function renderWorkspaceOne(
  verb: string,
  value: { workspace: WorkspaceView; note?: string },
): { type: 'text'; text: string }[] {
  const workspace = value.workspace;
  const lines = [
    `${verb}: ${workspace.title}`,
    `path: ${workspace.path}`,
    `id: ${workspace.id}`,
    `${workspace.sessionCount} session(s)`,
  ];
  if (workspace.status === 'missing-dir') lines.push('directory missing');
  if (value.note !== undefined) lines.push(value.note);
  return [{ type: 'text', text: lines.join('\n') }];
}

/** 构建一个工作区工具定义。 */
export function buildWorkspaceTool(
  name: WorkspaceToolName,
  deps: WorkspaceToolDeps,
): ToolDefinition {
  const { ctx, registry } = deps;

  switch (name) {
    case 'workspace_list':
      return defineTool({
        name: 'workspace_list',
        description:
          'List the registered workspaces (project directories) with their ids, titles, paths, and session counts. Start here to obtain a workspace id for the other workspace tools.',
        parameters: {},
        output: { schema: OUTPUT, render: renderWorkspaceList },
        async execute() {
          const { archived, pinned } = navigationState(ctx);
          const workspaces = await Promise.all(
            registry.list().map((workspace) => workspaceView(workspace, archived, pinned)),
          );
          return { count: workspaces.length, workspaces } as unknown as ToolJsonValue;
        },
      });

    case 'workspace_create':
      return defineTool({
        name: 'workspace_create',
        description:
          'Register an existing absolute directory as a workspace. Idempotent: a directory that is already registered returns its existing workspace with created false. Nothing is copied, moved, or deleted on disk, and no session is created.',
        parameters: {
          path: {
            type: 'string',
            required: true,
            description: 'Absolute path of an existing directory, for example C:\\projects\\app.',
          },
          title: { type: 'string', description: 'Display title. Defaults to the directory name.' },
        },
        output: {
          schema: OUTPUT,
          render: (_args, value) =>
            renderWorkspaceOne(
              (value as unknown as WorkspaceCreateView).created === true
                ? 'workspace created'
                : 'workspace already registered',
              value as unknown as WorkspaceCreateView,
            ),
        },
        async execute(args) {
          const target = typeof args.path === 'string' ? args.path.trim() : '';
          if (target === '' || !isAbsolute(target)) {
            throw new ToolArgsError(['path must be an absolute path of an existing directory']);
          }
          const { archived, pinned } = navigationState(ctx);
          let existing: WorkspaceLike | undefined;
          let created: WorkspaceLike | undefined;
          try {
            existing = await registry.resolveByPath(target);
            if (existing === undefined) created = await registry.create(target, args.title);
          } catch (error) {
            throw new Error(`Could not register '${target}' as a workspace: ${messageOf(error)}`);
          }
          if (existing !== undefined) {
            return {
              created: false,
              workspace: await workspaceView(existing, archived, pinned),
              note: 'The directory was already registered; its workspace is unchanged.',
            } as unknown as ToolJsonValue;
          }
          return {
            created: true,
            workspace: await workspaceView(created as WorkspaceLike, archived, pinned),
          } as unknown as ToolJsonValue;
        },
      });

    case 'workspace_remove':
      return defineTool({
        name: 'workspace_remove',
        description:
          'Remove a workspace registration. The directory, its files, and every session history stay untouched; its sessions become ungrouped. Re-adding the same directory later creates a fresh workspace with an empty session list.',
        parameters: {
          workspace_id: {
            type: 'string',
            required: true,
            description: 'Workspace id from workspace_list.',
          },
        },
        output: {
          schema: OUTPUT,
          render: (_args, value) => {
            const removed = value as unknown as WorkspaceRemoveView;
            return [
              {
                type: 'text',
                text: [
                  `removed workspace ${removed.removedId}`,
                  `path: ${removed.path}`,
                  'The directory and its sessions were left in place; sessions are now ungrouped.',
                ].join('\n'),
              },
            ];
          },
        },
        async execute(args) {
          const id = args.workspace_id.trim();
          const workspace = registry.get(id);
          if (workspace === undefined) {
            throw new Error(`No workspace with id '${id}'. Call workspace_list for current ids.`);
          }
          const removed = await registry.delete(id);
          return { removed, removedId: id, path: workspace.path } as unknown as ToolJsonValue;
        },
      });

    case 'workspace_rename':
      return defineTool({
        name: 'workspace_rename',
        description:
          'Change the display title of one registered workspace. Duplicate titles across workspaces are allowed; the directory path is unchanged.',
        parameters: {
          workspace_id: {
            type: 'string',
            required: true,
            description: 'Workspace id from workspace_list.',
          },
          title: { type: 'string', required: true, description: 'New display title.' },
        },
        output: {
          schema: OUTPUT,
          render: (_args, value) =>
            renderWorkspaceOne('workspace renamed', value as unknown as WorkspaceRenameView),
        },
        async execute(args) {
          const id = args.workspace_id.trim();
          const workspace = registry.get(id);
          if (workspace === undefined) {
            throw new Error(`No workspace with id '${id}'. Call workspace_list for current ids.`);
          }
          const title = args.title.trim();
          if (title === '') throw new ToolArgsError(['title must not be empty']);
          await workspace.setTitle(title);
          const { archived, pinned } = navigationState(ctx);
          return {
            workspace: await workspaceView(workspace, archived, pinned),
          } as unknown as ToolJsonValue;
        },
      });

    default:
      throw new Error(`unknown workspace tool '${String(name)}'`);
  }
}
