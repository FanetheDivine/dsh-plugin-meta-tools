/** 共享常量：插件标识、六个工具名与结果上限。 */

/** 错误消息、日志与行 id 使用的插件标识。 */
export const PLUGIN_LABEL = 'dsh-plugin-meta-tools';

/** 工作区工具名。 */
export const WORKSPACE_TOOL_NAMES = [
  'workspace_list',
  'workspace_create',
  'workspace_remove',
  'workspace_rename',
] as const;

/** 会话工具名。 */
export const SESSION_TOOL_NAMES = ['session_list', 'session_get'] as const;

/** 全部工具名，同时是配置键。 */
export const TOOL_NAMES = [...WORKSPACE_TOOL_NAMES, ...SESSION_TOOL_NAMES] as const;

/** 工具名联合类型。 */
export type ToolName = (typeof TOOL_NAMES)[number];

/** 标题读取的页长上限；超过时跳过读取。 */
export const TITLES_PAGE_LIMIT = 40;

/** `session_get` 单条消息的字符上限。 */
export const MESSAGE_TEXT_LIMIT = 2000;

/** `session_get` 全部消息的字符预算。 */
export const MESSAGES_TOTAL_LIMIT = 12000;

/** 开关在缺省或空值时的取值。 */
export const DEFAULT_SWITCH = true;
