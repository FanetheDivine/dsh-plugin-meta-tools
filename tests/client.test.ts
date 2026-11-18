// 前端入口接线测试：断言服务声明、字典与配置页槽位注册、双语文案与渲染结果。
import type {} from '@deepseek-ai/dsh-client-locale/client';
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type { SettingsFieldState } from '@deepseek-ai/dsh-client-ui-primitives';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { type ConfigFormState, ROW_ID, ROW_KEY } from '../src/client/config-form.ts';
import { ConfigPage } from '../src/client/config-page.tsx';
import { apply, inject } from '../src/client/index.ts';
import { en, NS, zh } from '../src/client/locales.ts';
import { TOOL_NAMES } from '../src/constants.ts';
import { makeClientCtx } from './helpers.ts';

/** 用字典与 `{name}` 模板参数构造翻译函数，行为与宿主 locale 座一致。 */
function translate(dict: Record<string, string>): TranslateNS<typeof NS> {
  return (key, params) =>
    (dict[key] ?? key).replace(/\{(\w+)\}/g, (_match, name: string) =>
      String(params?.[name] ?? ''),
    );
}

/** 六个开关的字段状态。 */
type SwitchFieldStates = { [K in (typeof TOOL_NAMES)[number]]: SettingsFieldState };

/** 六个开关的默认字段状态。 */
function fieldStates(text = 'true'): SwitchFieldStates {
  return Object.fromEntries(
    TOOL_NAMES.map((tool) => [tool, { text, overridden: false, invalid: false }]),
  ) as SwitchFieldStates;
}

/** 配置页的草稿状态。 */
function pageState(overrides: Partial<ConfigFormState> = {}): ConfigFormState {
  return {
    available: true,
    writable: true,
    dirty: false,
    invalid: false,
    saving: false,
    failed: false,
    ...fieldStates(),
    ...overrides,
  };
}

/** 渲染配置页：用假的选择器 Hook 返回给定状态。 */
function renderConfigPage(
  view: 'page' | 'summary',
  dict: Record<string, string>,
  state = pageState(),
): string {
  const props = {
    view,
    t: translate(dict),
    useConfigForm: <S>(select: (value: ConfigFormState) => S): S => select(state),
    edit: vi.fn(),
    resetField: vi.fn(),
    save: vi.fn(),
    discard: vi.fn(),
  };
  return renderToStaticMarkup(createElement(ConfigPage, props as never));
}

describe('前端入口', () => {
  it('声明实际使用的客户端服务', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms']);
  });

  it('注册双语字典与面板配置页', () => {
    const ctx = makeClientCtx();
    apply(ctx);

    expect(ctx._localeRegistrations.map((entry) => entry.ns)).toEqual([NS]);
    const dictionary = ctx._localeRegistrations[0];
    expect(Object.keys(dictionary?.dicts ?? {}).sort()).toEqual(['en', 'zh']);

    expect(ctx._slotInjections).toEqual(['plugins.row.config']);
    expect(ctx._slotRegistrations[0]?.options).toMatchObject({
      name: 'plugins.row.config',
      key: ROW_KEY,
      locale: NS,
    });
    expect(ctx._slotRegistrations[0]?.component).toBe(ConfigPage);
    expect(ctx._effects).toEqual([
      'dsh-plugin-meta-tools: dictionaries',
      'dsh-plugin-meta-tools: config form',
    ]);
    expect(ctx._configFormRequests).toEqual([ROW_ID]);
    expect(ROW_KEY).toBe(`${ROW_ID}#${ROW_ID}`);
  });

  it('卸载时释放配置表单的订阅', () => {
    const ctx = makeClientCtx();
    apply(ctx);
    const scope = ctx._configFormScopes[0];
    expect(scope?.subscriberCount()).toBe(1);

    ctx._dispose();
    expect(scope?.subscriberCount()).toBe(0);
  });
});

describe('字典', () => {
  it('中英字典键集一致且无空文案', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    expect(Object.values(zh).every((text) => text.trim() !== '')).toBe(true);
    expect(Object.values(en).every((text) => text.trim() !== '')).toBe(true);
  });

  it('六个工具都有标题与说明', () => {
    for (const tool of TOOL_NAMES) {
      expect((zh as Record<string, string>)[`config.${tool}.title`]).toBeTruthy();
      expect((zh as Record<string, string>)[`config.${tool}.description`]).toBeTruthy();
      expect((en as Record<string, string>)[`config.${tool}.title`]).toBeTruthy();
      expect((en as Record<string, string>)[`config.${tool}.description`]).toBeTruthy();
    }
  });
});

describe('配置页', () => {
  it('summary 渲染一行描述', () => {
    expect(renderConfigPage('summary', zh)).toContain('选择向模型开放哪些工作区与会话工具');
    expect(renderConfigPage('summary', en)).toContain(
      'Choose which workspace and session tools the model can call',
    );
  });

  it('page 渲染六个开关、标题与保存按钮', () => {
    const html = renderConfigPage('page', zh);
    for (const tool of TOOL_NAMES) {
      expect(html).toContain(`data-dsh-meta-tools-config="${tool}"`);
      expect(html).toContain((zh as Record<string, string>)[`config.${tool}.title`]);
    }
    expect(html.match(/role="switch"/g)).toHaveLength(6);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(6);
    expect(html).toContain('保存');
  });

  it('关闭的开关显示为未选中', () => {
    const state = pageState();
    state.session_get = { text: 'false', overridden: false, invalid: false };
    const html = renderConfigPage('page', zh, state);
    expect(html.match(/aria-checked="false"/g)).toHaveLength(1);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(5);
  });

  it('page 渲染英文文案', () => {
    const html = renderConfigPage('page', en);
    expect(html).toContain('List workspaces');
    expect(html).toContain('Read a session');
    expect(html).toContain('Save');
  });

  it('只读时禁用开关并显示只读提示', () => {
    const html = renderConfigPage('page', zh, pageState({ writable: false }));
    expect(html).toContain('此部署以只读方式保存设置。');
    expect(html.match(/<button[^>]*role="switch"[^>]*disabled/g)).toHaveLength(6);
  });

  it('命名空间未下发时显示不可用文案', () => {
    expect(renderConfigPage('page', zh, pageState({ available: false }))).toContain(
      '插件配置不可用。',
    );
  });
});
