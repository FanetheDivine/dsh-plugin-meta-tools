/**
 * 共享类型：宿主类型再导出与工作区/会话服务的最小结构契约。
 * 全部为 type-only 导入，编译后不留运行时依赖。
 */

import type { Context, Events, Volatile } from '@deepseek-ai/cordis';
// Type-only：拉取 loader/volatile-update 事件声明。
import type {} from '@deepseek-ai/cordis-plugin-loader';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools';

/** 插件配置类型。 */
export type { PluginConfig } from './config.ts';

/** 宿主类型。插件内统一从这里导入。 */
export type { Agent, Context, Events, ToolDefinition, ToolRunContext, Volatile };

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
  /** 归档会话 id 集合。 */
  readonly archivedSessionIds: readonly string[];
  /** 固定会话 id 集合。 */
  readonly pinnedSessionIds: readonly string[];
}

/** 会话头部中本插件读取的字段。 */
export interface SessionHeaderLike {
  /** 会话 id。 */
  readonly id: string;
  /** 记录的绝对工作目录。 */
  readonly cwd?: string;
  /** 创建时间，epoch 毫秒。 */
  readonly createdAt: number;
  /** 会话使用的预设。 */
  readonly agentPreset?: string;
}

/** 当前 surface 上的一条事件。 */
export interface SurfaceEventLike {
  /** 事件类型。 */
  readonly type: string;
  /** 事件数据；消息事件带 `content`。 */
  readonly data?: {
    /** 记录的内容块。 */
    readonly content?: unknown;
  };
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

/** 一个会话的当前模型可见面。 */
export interface SessionSurfaceLike {
  /** 会话头部。 */
  readonly session: SessionHeaderLike;
  /** 最后一条纳入观察的原始 seq；空日志为 null。 */
  readonly capturedThroughSeq: number | null;
  /** 当前 surface 事件，按模型历史顺序。 */
  readonly events: readonly SurfaceEventLike[];
}

/** 单个会话的标题观察结果。 */
export interface SessionTitleObservationLike {
  /** 请求的会话 id。 */
  readonly sessionId: string;
  /** 观察是否成功。 */
  readonly status: 'fulfilled' | 'rejected';
  /** 成功时的头部与标题。 */
  readonly value?: {
    /** 最新折叠标题。 */
    readonly title?: string;
  };
}

/** 会话查询服务（`ctx.sessionQuery`）中本插件用到的部分。 */
export interface SessionQueryLike {
  /** 列出全部会话，按最新优先。 */
  listSessions(signal?: AbortSignal): Promise<readonly SessionRecordLike[]>;
  /** 读取一个会话的当前 surface。 */
  readSurface(id: string): Promise<SessionSurfaceLike>;
  /** 批量折叠标题。 */
  readTitleSnapshots(
    ids: readonly string[],
    signal?: AbortSignal,
  ): Promise<readonly SessionTitleObservationLike[]>;
}

/** 会话注册表服务（`ctx.sessions`）中本插件用到的部分。 */
export interface SessionsServiceLike {
  /** 按 id 读取活动会话。 */
  get(id: string): unknown;
}