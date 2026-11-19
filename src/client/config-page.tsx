/**
 * 插件面板配置页：`summary` 一行描述，`page` 按三个能力分组渲染十一个带说明的工具开关。
 * 导出 ConfigPage 与其 props。
 */

// Type-only：拉取 plugins.row.config 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives';
import { SettingsForm, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CSSProperties } from 'react';

import { TOOL_GROUPS, type ToolGroup, type ToolName } from '../constants.ts';
import type { ConfigPageInjected } from './config-form.ts';
import type { MetaToolsKey, NS } from './locales.ts';

/** 配置页组件 props：行配置页的运行时值、字典与注入面。 */
export type ConfigPageProps = PropsRuntime<'plugins.row.config'> &
  PropsLocale<typeof NS> &
  InjectFace<ConfigPageInjected>;

/** 每个工具的标签键与说明键。 */
const TOOL_TEXT = {
  workspace_list: ['config.workspace_list.label', 'config.workspace_list.description'],
  workspace_create: ['config.workspace_create.label', 'config.workspace_create.description'],
  workspace_remove: ['config.workspace_remove.label', 'config.workspace_remove.description'],
  workspace_rename: ['config.workspace_rename.label', 'config.workspace_rename.description'],
  session_list: ['config.session_list.label', 'config.session_list.description'],
  session_get: ['config.session_get.label', 'config.session_get.description'],
  session_create: ['config.session_create.label', 'config.session_create.description'],
  session_stop: ['config.session_stop.label', 'config.session_stop.description'],
  session_send: ['config.session_send.label', 'config.session_send.description'],
  session_pin: ['config.session_pin.label', 'config.session_pin.description'],
  session_archive: ['config.session_archive.label', 'config.session_archive.description'],
} as const satisfies Record<ToolName, readonly [MetaToolsKey, MetaToolsKey]>;

/** 每个分组的标题键。 */
const GROUP_TITLE = {
  workspace: 'config.group.workspace',
  sessionRead: 'config.group.sessionRead',
  sessionManage: 'config.group.sessionManage',
} as const satisfies Record<ToolGroup, MetaToolsKey>;

/** 分组键，顺序与 TOOL_GROUPS 一致。 */
const GROUPS = Object.keys(TOOL_GROUPS) as ToolGroup[];

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
 * @returns `page` 按分组渲染十一个开关，`summary` 渲染该行缺失描述时的一行文案。
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
      {GROUPS.map((group) => (
        <section key={group} data-dsh-meta-tools-group={group} style={groupStyle}>
          <h4 style={groupTitleStyle}>{t(GROUP_TITLE[group])}</h4>
          {TOOL_GROUPS[group].map((tool) => {
            const [labelKey, descriptionKey] = TOOL_TEXT[tool];
            const label = t(labelKey);
            return (
              <div key={tool} data-dsh-meta-tools-config={tool} style={rowStyle}>
                <div style={textStyle}>
                  <span style={labelStyle}>{label}</span>
                  <p style={descriptionStyle}>{t(descriptionKey)}</p>
                </div>
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
        </section>
      ))}
    </SettingsForm>
  );
}

/** 分组容器：组间留白。 */
const groupStyle: CSSProperties = {
  marginBottom: 8,
};

/** 分组标题：12px、半粗、次级文字色。 */
const groupTitleStyle: CSSProperties = {
  margin: '16px 0 4px',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-secondary)',
};

/** 开关行：标签与说明在左，开关在右，行间以分隔线隔开。 */
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '12px 0',
  borderTop: '0.5px solid var(--dsw-alias-border-l2)',
};

/** 文字列：允许收缩，说明自动换行。 */
const textStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
};

/** 单行标签：13px、中等字重。 */
const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-primary)',
};

/** 开关说明：12px、次级文字色。 */
const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary)',
};
