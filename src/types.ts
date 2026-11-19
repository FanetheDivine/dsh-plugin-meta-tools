/**
 * 共享类型：宿主类型再导出与工作区/会话服务的最小结构契约。
 * 全部为 type-only 导入，编译后不留运行时依赖。
 */

import type { Context, Events, Volatile } from '@deepseek-ai/cordis';
// Type-only：拉取 loader/volatile-update 事件声明。
import type {} from '@deepseek-ai/cordis-plugin-loader';
import type { Agent, ModelSelection } from '@deepseek-ai/dsh-agent';
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools';

/** 插件配置类型。 */
export type { PluginConfig } from './config.ts';

/** 宿主类型。插件内统一从这里导入。 */
export type { Agent, Context, Events, ToolDefinition, ToolRunContext, Volatile };

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    /** 本插件投递的用户角色消息。 */
    'dsh-plugin-meta-tools': { kind: 'dsh-plugin-meta-tools' };
  }
}

/** 工具返回给宿主的 JSON 值。 */
export type ToolJsonValue =
  | string
  | number
  | boolean
  | null
  | ToolJsonValue[]
  | { [key: string]: ToolJsonValue };

/** 工作区注册表暴露的单个工作区。字段与宿主 0.2.2-rc.3 一致。 */
export interface WorkspaceLike {
  /** 稳定的注册 id。 */
  readonly id: string;
  /** 显示标题。 */
  readonly title: string;
  /** 规范化的绝对路径。 */
  readonly path: string;
  /** 按手动顺序排列的会话 id。 */
  readonly sessionIds: readonly string[];
  /** 创建时间，ISO-8601。 */
  readonly createdAt: string;
  /** 最近一次持久化修改时间，ISO-8601。 */
  readonly updatedAt: string;
  /** 实时检查目录是否存在。 */
  status(): Promise<'ok' | 'missing-dir'>;
  /** 持久化替换显示标题。 */
  setTitle(title: string): Promise<void>;
}

/** 工作区注册表服务（`ctx.workspaceRegistry`）中本插件用到的部分。 */
export interface WorkspaceRegistryLike {
  /** 按注册顺序列出全部工作区。 */
  list(): readonly WorkspaceLike[];
  /** 按 id 查找工作区。 */
  get(id: string): WorkspaceLike | undefined;
  /** 按目录路径查找已注册工作区。 */
  resolveByPath(path: string): Promise<WorkspaceLike | undefined>;
  /** 注册一个目录。 */
  create(path: string, title?: string): Promise<WorkspaceLike>;
  /** 移除注册记录。 */
  delete(id: string): Promise<boolean>;
  /** 归档一个会话。 */
  archiveSession(id: string, options?: { readonly stopActivity?: boolean }): Promise<void>;
  /** 解除归档。 */
  unarchiveSession(id: string): Promise<void>;
  /** 置顶一个会话。 */
  pinSession(id: string): Promise<void>;
  /** 取消置顶。 */
  unpinSession(id: string): Promise<void>;
  /** 归档会话 id 集合。 */
  readonly archivedSessionIds: readonly string[];
  /** 固定会话 id 集合。 */
  readonly pinnedSessionIds: readonly string[];
}

/** 会话头部中本插件读取的字段。 */
export interface SessionHeaderLike {
  /** 会话 id。 */
  readonly id: string;
  /** 会话格式版本。 */
  readonly version?: number;
  /** 记录的绝对工作目录。 */
  readonly cwd?: string;
  /** 创建时间，epoch 毫秒。 */
  readonly createdAt: number;
  /** 会话使用的预设。 */
  readonly agentPreset?: string;
  /** 父会话引用；subagent 会话带此字段。 */
  readonly parentSession?: string;
  /** 会话来源。 */
  readonly origin?: 'subagent';
  /** 是否为种子会话。 */
  readonly isSeeded?: boolean;
  /** 委派深度。 */
  readonly delegationDepth?: number;
}

/** 一条会话事件的原始记录。 */
export interface SessionEventLike {
  /** 事件序号。 */
  readonly seq: number;
  /** 事件类型。 */
  readonly type: string;
}

/** 完整会话日志。 */
export interface SessionLogSnapshotLike {
  /** 会话头部。 */
  readonly session: SessionHeaderLike;
  /** 继承的事件数。 */
  readonly inheritedEventCount?: number;
  /** 按 seq 升序的完整事件。 */
  readonly events: readonly SessionEventLike[];
}

/** 会话树中的一个后代节点。 */
export interface SessionLineageNodeLike {
  /** 该后代的记录。 */
  readonly session: SessionRecordLike;
  /** 它的直接子节点。 */
  readonly descendants: readonly SessionLineageNodeLike[];
}

/** 会话树：目标与全部后代。 */
export interface SessionLineageLike {
  /** 被查询的会话。 */
  readonly target: SessionRecordLike;
  /** 直接子节点。 */
  readonly descendants: readonly SessionLineageNodeLike[];
}

/** 会话查询返回的记录。 */
export interface SessionRecordLike {
  /** 会话头部。 */
  readonly header: SessionHeaderLike;
  /** 是否存在于 `ctx.sessions`。 */
  readonly live: boolean;
  /** 是否由持久化后端列出。 */
  readonly persisted: boolean;
}

/** 单个会话的标题观察结果。 */
export interface SessionTitleObservationLike {
  /** 请求的会话 id。 */
  readonly sessionId: string;
  /** 观察是否成功。 */
  readonly status: 'fulfilled' | 'rejected';
  /** 成功时的头部与标题。 */
  readonly value?: {
    /** 最新标题快照；日志没有标题时省略。 */
    readonly title?: {
      /** 规范化后的非空标题。 */
      readonly title: string;
    };
  };
}

/** 会话查询服务（`ctx.sessionQuery`）中本插件用到的部分。 */
export interface SessionQueryLike {
  /** 列出全部会话，按最新优先。 */
  listSessions(signal?: AbortSignal): Promise<readonly SessionRecordLike[]>;
  /** 批量折叠标题。 */
  readTitleSnapshots(
    ids: readonly string[],
    signal?: AbortSignal,
  ): Promise<readonly SessionTitleObservationLike[]>;
  /** 读取一个会话的完整日志。 */
  readSession(id: string): Promise<SessionLogSnapshotLike>;
  /** 追溯一个会话的祖先与后代。 */
  traceSession(id: string, signal?: AbortSignal): Promise<SessionLineageLike>;
}

/** 文本内容块。 */
export interface TextContentBlockLike {
  readonly type: 'text';
  readonly text: string;
}

/** 模型运行时中本插件用到的精确配置校验能力。 */
export interface LlmLike {
  /** 校验 provider/model 与可选 reasoning effort。 */
  resolveCallConfig(config: Readonly<ModelSelection>, signal?: AbortSignal): Promise<unknown>;
}

/** 新建会话的请求。 */
export interface SessionCreateRequestLike {
  readonly sessionId?: string;
  readonly workspaceId?: string;
  readonly cwd?: string;
  readonly agentPreset?: string;
}

/** 新建会话的结果。 */
export interface SessionCreateResultLike {
  readonly sessionId: string;
  readonly agentPreset?: string;
}

/** 重命名会话的结果。 */
export interface SessionRenameResultLike {
  readonly title: string;
  readonly seq?: number;
}

/** 普通会话 Agent 的解析结果。 */
export type SessionAgentResultLike = { readonly agent: Agent } | { readonly error: Error };

/** 会话控制服务（`ctx.sessionController`）中本插件用到的部分。 */
export interface SessionControllerLike {
  /** 新建或复用会话。 */
  create(request: SessionCreateRequestLike): Promise<SessionCreateResultLike>;
  /** 重命名会话。 */
  rename(request: {
    readonly sessionId: string;
    readonly title: string;
  }): Promise<SessionRenameResultLike>;
  /** 解析或恢复普通会话的 Agent。 */
  resolveAgent(sessionId: string): Promise<SessionAgentResultLike>;
  /** 取消当前轮次。 */
  cancel(request: { readonly sessionId: string }): { readonly accepted: true };
}

/** 子代理路由服务（`ctx.subagents`）中本插件用到的部分。 */
export interface SubagentsLike {
  /** 中断一个 subagent 会话的当前执行。 */
  interrupt(
    targetSessionId: string,
    authority: { readonly kind: 'ancestor'; readonly agent: Agent },
  ): void;
}

/** 活动会话表（`ctx.sessions`）中本插件用到的部分。 */
export interface SessionsServiceLike {
  /** 按 id 读取活动会话。 */
  get(id: string): unknown;
  /** 落盘屏障。 */
  flush(session: unknown): Promise<boolean>;
}
