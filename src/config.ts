/**
 * 插件配置：十一个工具开关、三个默认模型字符串、默认值与严格校验。
 * 导出 Config、PluginConfig、DEFAULT_CONFIG、resolveConfig、readConfig 与 sessionModelSelection。
 */
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm';
import Schema from '@deepseek-ai/schemastery';

import {
  DEFAULT_SWITCH,
  PLUGIN_LABEL,
  SESSION_MODEL_CONFIG_KEYS,
  type SessionModelConfigKey,
  TOOL_NAMES,
  type ToolName,
} from './constants.ts';
import type { ModelSelection, Volatile } from './types.ts';
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
  /** 新增会话的默认 provider；与 session_model 同时为空或同时非空。 */
  session_provider: Volatile<string>;
  /** 新增会话的默认模型；与 session_provider 同时为空或同时非空。 */
  session_model: Volatile<string>;
  /** 新增会话的默认推理等级；非空时要求默认 provider 与 model 非空。 */
  session_effort: Volatile<string>;
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
  session_provider: Schema.string().default('').volatile(),
  session_model: Schema.string().default('').volatile(),
  session_effort: Schema.string().default('').volatile(),
}) as unknown as Schema<Config>;

/** 配置项的实时取值：工具开关与默认模型字符串。 */
export type PluginConfig = { [K in ToolName]: boolean } & {
  [K in SessionModelConfigKey]: string;
};

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
  session_provider: '',
  session_model: '',
  session_effort: '',
});

/** 合法的配置键：工具名与默认模型字段。 */
const CONFIG_KEYS = new Set<string>([...TOOL_NAMES, ...SESSION_MODEL_CONFIG_KEYS]);

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
  const config: Record<string, boolean | string> = { ...DEFAULT_CONFIG };
  for (const name of TOOL_NAMES) {
    const value = input[name];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'boolean') {
      throw new Error(`${PLUGIN_LABEL}: config ${name} must be a boolean`);
    }
    config[name] = value;
  }
  for (const name of SESSION_MODEL_CONFIG_KEYS) {
    const value = input[name];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string') {
      throw new Error(`${PLUGIN_LABEL}: config ${name} must be a string`);
    }
    config[name] = value;
  }
  const provider = String(config.session_provider).trim();
  const model = String(config.session_model).trim();
  const effort = String(config.session_effort).trim();
  if ((provider === '') !== (model === '')) {
    throw new Error(
      `${PLUGIN_LABEL}: config session_provider and session_model must be set together`,
    );
  }
  if (effort !== '' && provider === '') {
    throw new Error(
      `${PLUGIN_LABEL}: config session_effort requires session_provider and session_model`,
    );
  }
  return Object.freeze(config) as Readonly<PluginConfig>;
}

/** 读取配置中的完整默认模型；未配置时返回 undefined。 */
export function sessionModelSelection(config: Readonly<PluginConfig>): ModelSelection | undefined {
  const provider = config.session_provider.trim();
  const model = config.session_model.trim();
  const effort = config.session_effort.trim();
  if (provider === '' || model === '') return undefined;
  return {
    provider,
    model,
    ...(effort === '' ? {} : { reasoningEffort: ReasoningEffortId(effort) }),
  };
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
