// 预设选择器纯函数测试：触发文案、菜单顺序与不可用标注。

import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { describe, expect, it } from 'vitest';
import type { NS } from '../src/client/locales.ts';
import { zh } from '../src/client/locales.ts';
import type { PresetDefaultsState } from '../src/client/preset-defaults.ts';
import { currentText, menuItems } from '../src/client/preset-select.tsx';

/** 用中文字典构造翻译函数。 */
const t: TranslateNS<typeof NS> = (key) => zh[key];

/** 构造一个预设目录状态。 */
function state(overrides: Partial<PresetDefaultsState> = {}): PresetDefaultsState {
  return {
    status: 'ready',
    error: null,
    rows: [
      { id: 'standard', name: 'Standard' },
      { id: 'cordis', name: 'Creator' },
    ],
    current: '',
    ...overrides,
  };
}

describe('预设选择器文案', () => {
  it('未选择时显示跟随宿主默认', () => {
    expect(currentText(state(), t)).toBe('跟随宿主默认');
  });

  it('已选择时显示预设名称，名称缺失时显示标识', () => {
    expect(currentText(state({ current: 'cordis' }), t)).toBe('Creator');
    expect(currentText(state({ current: 'custom', rows: [{ id: 'custom' }] }), t)).toBe('custom');
  });

  it('已保存值不在名册时标注不可用', () => {
    expect(currentText(state({ current: 'gone' }), t)).toBe('gone · 不可用');
  });

  it('加载中、失败与无服务各有文案', () => {
    expect(currentText(state({ status: 'loading' }), t)).toBe('加载中…');
    expect(currentText(state({ status: 'error' }), t)).toBe('预设加载失败');
    expect(currentText(state({ status: 'noService' }), t)).toBe('此部署不提供预设');
  });
});

describe('预设菜单', () => {
  it('首项为跟随宿主默认，其后按名册顺序', () => {
    expect(menuItems(state(), t)).toEqual([
      { id: '', label: '跟随宿主默认' },
      { id: 'standard', label: 'Standard' },
      { id: 'cordis', label: 'Creator' },
    ]);
  });

  it('已保存但不可用的值以禁用项补足', () => {
    const items = menuItems(state({ current: 'gone' }), t);
    expect(items.at(-1)).toEqual({ id: 'gone', label: 'gone · 不可用', disabled: true });
  });

  it('名册未就绪时不补不可用项', () => {
    expect(menuItems(state({ status: 'error', current: 'gone', rows: [] }), t)).toHaveLength(1);
  });
});
