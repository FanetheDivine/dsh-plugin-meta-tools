// 预设目录测试：名册过滤、草稿回显、选择写入、失败与降级状态。
import { describe, expect, it, vi } from 'vitest';

import { type ConfigFields, PluginConfigForm } from '../src/client/config-form.ts';
import { PresetDefaults } from '../src/client/preset-defaults.ts';
import { DEFAULT_CONFIG } from '../src/config.ts';
import { makeClientCtx, makeConfigFormScope } from './helpers.ts';

/** 构造配置页表单与预设目录。 */
function setup() {
  const ctx = makeClientCtx();
  const presets = vi.spyOn(ctx.remote.agentPresets, 'list');
  const scope = makeConfigFormScope<ConfigFields>({ value: { ...DEFAULT_CONFIG } });
  const form = new PluginConfigForm(scope.scope);
  const actions = form.inject();
  const defaults = new PresetDefaults(ctx, actions.hooks.configForm, actions.edit);
  return { ctx, scope, form, actions, defaults, presets };
}

describe('预设目录', () => {
  it('读取名册并过滤损坏的预设', async () => {
    const { defaults, presets } = setup();
    presets.mockResolvedValue({
      ok: true,
      value: {
        presets: [
          { id: 'standard', name: 'Standard', isDefault: true },
          { id: 'broken', name: 'Broken', broken: 'missing plugin' },
        ],
      },
    });
    await defaults.load();

    const state = defaults.inject().hooks.presetDefaults.getSnapshot();
    expect(state.status).toBe('ready');
    expect(state.rows).toEqual([{ id: 'standard', name: 'Standard', isDefault: true }]);
  });

  it('没有预设服务时进入 noService', async () => {
    const { ctx, defaults } = setup();
    delete (ctx.remote as unknown as { agentPresets?: unknown }).agentPresets;
    await defaults.load();

    expect(defaults.inject().hooks.presetDefaults.getSnapshot().status).toBe('noService');
  });

  it('调用不可用时按无服务处理', async () => {
    const { defaults, presets } = setup();
    presets.mockResolvedValue({
      ok: false,
      error: { code: 'gateway/invocation-unavailable', message: 'not mounted' },
    });
    await defaults.load();

    expect(defaults.inject().hooks.presetDefaults.getSnapshot().status).toBe('noService');
  });

  it('读取失败时保留错误信息', async () => {
    const { defaults, presets } = setup();
    presets.mockRejectedValue(new Error('roster offline'));
    await defaults.load();

    const state = defaults.inject().hooks.presetDefaults.getSnapshot();
    expect(state.status).toBe('error');
    expect(state.error).toBe('roster offline');
  });

  it('读取失败后可重试成功', async () => {
    const { defaults, presets } = setup();
    presets.mockRejectedValueOnce(new Error('offline'));
    await defaults.load();
    expect(defaults.inject().hooks.presetDefaults.getSnapshot().status).toBe('error');

    presets.mockResolvedValue({ ok: true, value: { presets: [{ id: 'standard' }] } });
    await defaults.load();

    const state = defaults.inject().hooks.presetDefaults.getSnapshot();
    expect(state.status).toBe('ready');
    expect(state.rows).toHaveLength(1);
  });

  it('选择空值回到跟随宿主默认', async () => {
    const { actions, defaults } = setup();
    await defaults.load();
    defaults.inject().select('standard');
    defaults.inject().select('');

    expect(actions.hooks.configForm.getSnapshot().session_preset.text).toBe('');
  });

  it('选择写入配置草稿', async () => {
    const { actions, defaults } = setup();
    await defaults.load();
    defaults.inject().select('cordis');

    expect(actions.hooks.configForm.getSnapshot().session_preset.text).toBe('cordis');
  });

  it('草稿变化后回显当前选择', async () => {
    const { actions, defaults } = setup();
    await defaults.load();
    actions.edit('session_preset', 'cordis');

    expect(defaults.inject().hooks.presetDefaults.getSnapshot().current).toBe('cordis');
  });
});
