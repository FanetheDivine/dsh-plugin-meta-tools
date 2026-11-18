/** 共享常量：插件标识、十一个工具名、配置键与结果上限。 */

/** 错误消息、日志与行 id 使用的插件标识。 */
export const PLUGIN_LABEL = 'dsh-plugin-meta-tools';

/** 工作区工具名。 */
export const WORKSPACE_TOOL_NAMES = [
  'workspace_list',
  'workspace_create',
  'workspace_remove',
  'workspace_rename',
] as const;

/** 会话读取工具名。 */
export const SESSION_READ_TOOL_NAMES = ['session_list', 'session_get'] as const;

/** 会话控制工具名。 */
export const SESSION_CONTROL_TOOL_NAMES = [
  'session_create',
  'session_stop',
  'session_send',
] as const;

/** 会话导航工具名：置顶与归档。 */
export const SESSION_NAVIGATION_TOOL_NAMES = ['session_pin', 'session_archive'] as const;

/** 全部会话工具名。 */
export const SESSION_TOOL_NAMES = [
  ...SESSION_READ_TOOL_NAMES,
  ...SESSION_CONTROL_TOOL_NAMES,
  ...SESSION_NAVIGATION_TOOL_NAMES,
] as const;

/** 全部工具名，同时是配置键。 */
export const TOOL_NAMES = [...WORKSPACE_TOOL_NAMES, ...SESSION_TOOL_NAMES] as const;

/** 工具名联合类型。 */
export type ToolName = (typeof TOOL_NAMES)[number];

/** 标题扫描上限；按标题查询时最多折叠的会话数。 */
export const TITLE_SCAN_LIMIT = 200;

/** 开关在缺省或空值时的取值。 */
export const DEFAULT_SWITCH = true;
