/** 共享常量：插件标识、十一个工具名、三个模型配置键、能力分组与结果上限。 */

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

/** 新增会话默认模型的配置键。 */
export const SESSION_MODEL_CONFIG_KEYS = [
  'session_provider',
  'session_model',
  'session_effort',
] as const;

/** 默认模型配置键联合类型。 */
export type SessionModelConfigKey = (typeof SESSION_MODEL_CONFIG_KEYS)[number];

/** 新增会话默认预设的配置键。 */
export const SESSION_PRESET_CONFIG_KEYS = ['session_preset'] as const;

/** 新增会话默认配置键：默认模型与默认预设。 */
export const SESSION_DEFAULT_CONFIG_KEYS = [
  ...SESSION_MODEL_CONFIG_KEYS,
  ...SESSION_PRESET_CONFIG_KEYS,
] as const;

/** 默认配置键联合类型。 */
export type SessionDefaultConfigKey = (typeof SESSION_DEFAULT_CONFIG_KEYS)[number];

/** 配置页的能力分组：工作区、查看会话、管理会话；按顺序拼接后等于 TOOL_NAMES。 */
export const TOOL_GROUPS = {
  workspace: WORKSPACE_TOOL_NAMES,
  sessionRead: SESSION_READ_TOOL_NAMES,
  sessionManage: [...SESSION_CONTROL_TOOL_NAMES, ...SESSION_NAVIGATION_TOOL_NAMES],
} as const satisfies Record<string, readonly ToolName[]>;

/** 能力分组键。 */
export type ToolGroup = keyof typeof TOOL_GROUPS;

/** 标题扫描上限；按标题查询时最多折叠的会话数。 */
export const TITLE_SCAN_LIMIT = 200;

/** 开关在缺省或空值时的取值。 */
export const DEFAULT_SWITCH = true;
