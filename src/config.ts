/**
 * 插件配置：十一个以工具名命名的热重载开关、默认值与严格校验。
 * 导出 Config、PluginConfig、DEFAULT_CONFIG、resolveConfig 与 readConfig。
 */
import Schema from '@deepseek-ai/schemastery';

import { DEFAULT_SWITCH, PLUGIN_LABEL, TOOL_NAMES, type ToolName } from './constants.ts';
import type { Volatile } from './types.ts';
import { isRecord } from './utils.ts';

/** 宿主传给 apply 的配置：每个字段是热重载引用，用 `.get()` 读取实时值。 */
export interface Config {
  /** 是否注册 workspace_list。 */
  workspace_list: Volatile<boolean>;
  /** 是否注册 workspace_create。 */
  workspace_create: Volatile<boolean>;
  /** 是否注册 workspace_remove。 */
  workspace_remove: Volatile<boolean>;
  /** 是否注册 workspace_rename。 */
  workspace_rename: Volatile<boolean>;
  /** 是否注册 session_list。 */
  session_list: Volatile<boolean>;
  /** 是否注册 session_get。 */
  session_get: Volatile<boolean>;
  /** 是否注册 session_create。 */
  session_create: Volatile<boolean>;
  /** 是否注册 session_stop。 */
  session_stop: Volatile<boolean>;
  /** 是否注册 session_send。 */
  session_send: Volatile<boolean>;
  /** 是否注册 session_pin。 */
  session_pin: Volatile<boolean>;
  /** 是否注册 session_archive。 */
  session_archive: Volatile<boolean>;
}

/**
 * 配置 schema。`.volatile()` 字段修改后不重启插件，并出现在“插件”面板的配置页。
 * schema 不拒绝未知键，严格校验由 resolveConfig 完成。
 */
export const Config: Schema<Config> = Schema.object({
  workspace_list: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  workspace_create: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  workspace_remove: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  workspace_rename: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_list: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_get: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_create: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_stop: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_send: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_pin: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
  session_archive: Schema.boolean().default(DEFAULT_SWITCH).volatile(),
}) as unknown as Schema<Config>;

/** 配置项的实时取值：工具名到开关的映射。 */
export type PluginConfig = { [K in ToolName]: boolean };

/** 默认配置：十一个工具全部开启。 */
export const DEFAULT_CONFIG: Readonly<PluginConfig> = Object.freeze({
  workspace_list: DEFAULT_SWITCH,
  workspace_create: DEFAULT_SWITCH,
  workspace_remove: DEFAULT_SWITCH,
  workspace_rename: DEFAULT_SWITCH,
  session_list: DEFAULT_SWITCH,
  session_get: DEFAULT_SWITCH,
  session_create: DEFAULT_SWITCH,
  session_stop: DEFAULT_SWITCH,
  session_send: DEFAULT_SWITCH,
  session_pin: DEFAULT_SWITCH,
  session_archive: DEFAULT_SWITCH,
});

/** 合法的配置键：全部工具名。 */
const CONFIG_KEYS = new Set<string>(TOOL_NAMES);

/** 把缺省或 null 的输入转为空对象。 */
function normalizeConfigInput(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (!isRecord(raw)) throw new Error(`${PLUGIN_LABEL}: config must be an object`);
  return raw;
}

/** 校验配置并与默认值合并，返回冻结的完整配置。 */
export function resolveConfig(raw?: unknown): Readonly<PluginConfig> {
  const input = normalizeConfigInput(raw);
  for (const key of Object.keys(input)) {
    if (!CONFIG_KEYS.has(key)) throw new Error(`${PLUGIN_LABEL}: unknown config key "${key}"`);
  }
  const config: Record<ToolName, boolean> = { ...DEFAULT_CONFIG };
  for (const name of TOOL_NAMES) {
    const value = input[name];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'boolean') {
      throw new Error(`${PLUGIN_LABEL}: config ${name} must be a boolean`);
    }
    config[name] = value;
  }
  return Object.freeze(config);
}

/** 判断值是否是热重载引用。 */
function isVolatileRef(value: unknown): value is { get(): unknown } {
  return isRecord(value) && typeof value.get === 'function';
}

/** 读取宿主传入配置的当前值：展开热重载引用后交给 resolveConfig 校验。 */
export function readConfig(config?: unknown): Readonly<PluginConfig> {
  if (!isRecord(config)) return resolveConfig(config);
  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    values[key] = isVolatileRef(value) ? value.get() : value;
  }
  return resolveConfig(values);
}
