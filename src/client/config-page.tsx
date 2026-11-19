/**
 * 插件面板配置页：`summary` 一行描述，`page` 渲染默认模型选择器与三个工具开关分组。
 * 导出 ConfigPage 与其 props。
 */

import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import { ModelSelect } from '@deepseek-ai/dsh-client-ui-model-selection/src/client/ModelSelect.tsx';
import type { ModelLabelOwner } from '@deepseek-ai/dsh-client-ui-model-selection/src/client/slots.ts';
// Type-only：拉取 plugins.row.config 与官方模型座槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives';
import { SettingsForm, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ComponentProps, CSSProperties } from 'react';

import { TOOL_GROUPS, type ToolGroup, type ToolName } from '../constants.ts';
import type { ConfigPageInjected } from './config-form.ts';
import type { MetaToolsKey, NS } from './locales.ts';
import type { ModelDefaultsInjected } from './model-defaults.ts';

/** 配置页组件 props：行配置页的运行时值、字典、默认模型与注入面。 */
export type ConfigPageProps = PropsRuntime<'plugins.row.config'> &
  PropsLocale<typeof NS> &
  InjectFace<ConfigPageInjected> & { modelDefaults: ModelDefaultsInjected };

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

/** 模型标签：在 trigger、根菜单与选项中显示 provider，且不追加团队协作控制。 */
export const renderModelSlot: ComponentProps<typeof ModelSelect>['renderSlot'] = (name, owner) => {
  if (name === 'conversation.input.model.label') {
    const label = owner as unknown as ModelLabelOwner;
    return (
      <span data-dsh-meta-tools-provider={label.provider.id}>
        {label.provider.name} / {label.model.name}
      </span>
    );
  }
  return null;
};

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
      <section data-dsh-meta-tools-group="sessionModel" style={groupStyle}>
        <h3 style={groupTitleStyle}>{t('config.group.sessionModel')}</h3>
        <div data-dsh-meta-tools-model="default" style={modelRowStyle}>
          <span style={labelStyle}>{t('config.sessionModel.label')}</span>
          <div style={modelSelectorStyle}>
            <ModelSelect
              {...props.modelDefaults}
              locked={disabled}
              available={state.available}
              renderSlot={renderModelSlot}
            />
          </div>
          <p style={modelDescriptionStyle}>{t('config.sessionModel.description')}</p>
        </div>
      </section>
      {GROUPS.map((group) => (
        <section key={group} data-dsh-meta-tools-group={group} style={groupStyle}>
          <h3 style={groupTitleStyle}>{t(GROUP_TITLE[group])}</h3>
          {TOOL_GROUPS[group].map((tool) => {
            const [labelKey, descriptionKey] = TOOL_TEXT[tool];
            const label = t(labelKey);
            return (
              <div key={tool} data-dsh-meta-tools-config={tool} style={rowStyle}>
                <code style={toolNameStyle}>{tool}</code>
                <span style={labelStyle}>{label}</span>
                <Switch
                  checked={state[tool].text === 'true'}
                  disabled={disabled}
                  label={label}
                  onChange={(next) => {
                    props.edit(tool, next ? 'true' : 'false');
                  }}
                />
                <p style={descriptionStyle}>{t(descriptionKey)}</p>
              </div>
            );
          })}
        </section>
      ))}
    </SettingsForm>
  );
}

/** 默认模型行：标签、选择器与说明。 */
const modelRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 240px) minmax(180px, 360px)',
  alignItems: 'center',
  columnGap: 20,
  maxWidth: 620,
  padding: '14px 0',
  borderTop: '0.5px solid var(--dsw-alias-border-l2)',
};

/** 选择器容器：使用官方触发器的可用宽度。 */
const modelSelectorStyle: CSSProperties = {
  minWidth: 0,
};

/** 默认模型说明。 */
const modelDescriptionStyle: CSSProperties = {
  gridColumn: '1 / 3',
  margin: '4px 0 0',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary)',
};

/** 分组容器：组间留白。 */
const groupStyle: CSSProperties = {
  marginBottom: 8,
};

/** 分组标题：一级分组使用 16px 半粗主文字色。 */
const groupTitleStyle: CSSProperties = {
  margin: '20px 0 8px',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-primary)',
};

/** 开关行：工具名、功能名与开关固定成三列，全部开关竖直对齐。 */
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 180px) minmax(0, 240px) 36px',
  alignItems: 'center',
  columnGap: 20,
  width: '100%',
  maxWidth: 620,
  padding: '14px 0',
  borderTop: '0.5px solid var(--dsw-alias-border-l2)',
};

/** 工具名：等宽 14px，与功能名区分。 */
const toolNameStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: 'anywhere',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-secondary)',
};

/** 功能名：14px、中等字重。 */
const labelStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-primary)',
};

/** 开关说明：位于功能名下方，窄屏自动换行。 */
const descriptionStyle: CSSProperties = {
  gridColumn: '2 / 4',
  minWidth: 0,
  overflowWrap: 'anywhere',
  margin: '2px 0 0',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary)',
};
