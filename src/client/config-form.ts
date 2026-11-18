/**
 * 插件面板配置页的草稿模型：用官方 SettingsFormModel 暂存十一个热重载开关。
 * 导出行键、命名空间、PluginConfigForm 与注入面类型。
 */

import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type {
  SettingsFieldSpec,
  SettingsFieldState,
  SettingsFormActions,
  SettingsFormScope,
  SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives';
import { SettingsFormModel } from '@deepseek-ai/dsh-client-ui-primitives';

import { TOOL_NAMES, type ToolName } from '../constants.ts';

/** 插件在“插件”页的配置页键：`<包名>#<行 id>`。 */
export const ROW_KEY = 'dsh-plugin-meta-tools#dsh-plugin-meta-tools';

/** 行 id。同时是宿主配置的条目 id 与表单命名空间。 */
export const ROW_ID = 'dsh-plugin-meta-tools';

/** 配置页可编辑的十一个开关，取值与宿主 `Config` 的实时值一致。 */
export type ConfigFields = { [K in ToolName]: boolean };

/** 配置页读取的草稿与表单状态。 */
export type ConfigFormState = SettingsFormShell & { [K in ToolName]: SettingsFieldState };

/** 配置页向槽位组件提供的注入值。 */
export interface ConfigPageInjected extends SettingsFormActions {
  /** 草稿与表单状态。 */
  hooks: { configForm: SnapshotStore<ConfigFormState> };
}

/** 单个工具开关的字段定义：草稿只有 `true` 与 `false`。 */
function switchSpec(field: ToolName): SettingsFieldSpec {
  return {
    field,
    format: (value) => (value === false ? 'false' : 'true'),
    parse: (text) =>
      text === 'true' || text === 'false' ? { kind: 'set', value: text === 'true' } : undefined,
  };
}

/** 十一个开关的字段定义，顺序与工具顺序一致。 */
const SWITCH_SPECS: SettingsFieldSpec[] = TOOL_NAMES.map(switchSpec);

/**
 * 暂存六处编辑，保存时一次写入宿主配置。
 * 保留模式：离开配置页丢弃草稿，写入只发生在保存。
 */
export class PluginConfigForm {
  private readonly form: SettingsFormModel<ConfigFields>;
  private readonly state: SnapshotStore<ConfigFormState>;

  /** @param scope - 宿主为该行提供的配置表单。 */
  constructor(scope: SettingsFormScope<ConfigFields>) {
    this.form = new SettingsFormModel(scope, SWITCH_SPECS);
    this.state = this.form.bind(() => {
      const fields = {} as Record<ToolName, SettingsFieldState>;
      for (const tool of TOOL_NAMES) fields[tool] = this.form.field(tool);
      return { ...this.form.shell(), ...fields };
    });
  }

  /** @returns 配置页向槽位组件提供的注入值。 */
  inject(): ConfigPageInjected {
    return { hooks: { configForm: this.state }, ...this.form.actions() };
  }

  /** 释放对宿主表单的订阅。 */
  dispose(): void {
    this.form.dispose();
  }
}
