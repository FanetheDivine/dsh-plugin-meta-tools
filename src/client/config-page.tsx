/**
 * 插件面板配置页：`summary` 一行描述，`page` 用官方开关控件渲染十一个工具开关。
 * 导出 ConfigPage 与其 props。
 */

// Type-only：拉取 plugins.row.config 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives';
import { SettingsForm, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CSSProperties } from 'react';

import { TOOL_NAMES, type ToolName } from '../constants.ts';
import type { ConfigPageInjected } from './config-form.ts';
import type { MetaToolsKey, NS } from './locales.ts';

/** 配置页组件 props：行配置页的运行时值、字典与注入面。 */
export type ConfigPageProps = PropsRuntime<'plugins.row.config'> &
  PropsLocale<typeof NS> &
  InjectFace<ConfigPageInjected>;

/** 每个工具的单行标签键。 */
const TOOL_LABEL = {
  workspace_list: 'config.workspace_list.label',
  workspace_create: 'config.workspace_create.label',
  workspace_remove: 'config.workspace_remove.label',
  workspace_rename: 'config.workspace_rename.label',
  session_list: 'config.session_list.label',
  session_get: 'config.session_get.label',
  session_create: 'config.session_create.label',
  session_stop: 'config.session_stop.label',
  session_send: 'config.session_send.label',
  session_pin: 'config.session_pin.label',
  session_archive: 'config.session_archive.label',
} as const satisfies Record<ToolName, MetaToolsKey>;

/** 表单框架文案。 */
function formLabels(t: ConfigPageProps['t']): SettingsFormLabels {
  return {
    unavailable: t('config.unavailable'),
    readOnly: t('config.readOnly'),
    saveFailed: t('config.saveFailed'),
    save: t('config.save'),
    saving: t('config.saving'),
  };
}

/**
 * 渲染本插件在“插件”页的行配置。
 * @param props - 视图名、已暂存的表单，以及编辑、保存与放弃动作。
 * @returns `page` 渲染十一个开关，`summary` 渲染该行缺失描述时的一行文案。
 */
export function ConfigPage(props: ConfigPageProps) {
  const { t } = props;
  const state = props.useConfigForm((value) => value);
  if (props.view === 'summary') return t('config.summary');
  const disabled = !state.writable || state.saving;
  return (
    <SettingsForm
      labels={formLabels(t)}
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      {TOOL_NAMES.map((tool) => {
        const label = t(TOOL_LABEL[tool]);
        return (
          <div key={tool} data-dsh-meta-tools-config={tool} style={rowStyle}>
            <span style={labelStyle}>{label}</span>
            <Switch
              checked={state[tool].text === 'true'}
              disabled={disabled}
              label={label}
              onChange={(next) => {
                props.edit(tool, next ? 'true' : 'false');
              }}
            />
          </div>
        );
      })}
    </SettingsForm>
  );
}

/** 开关行：标签在左，开关在右，与官方配置页的开关行一致。 */
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '12px 0',
};

/** 单行标签：13px、中等字重。 */
const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-primary)',
};
