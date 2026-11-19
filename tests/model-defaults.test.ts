// 默认模型目录测试：目录回显、草稿选择、模型切换清理 effort 与卸载。
import { describe, expect, it, vi } from 'vitest';
import { type ConfigFields, PluginConfigForm } from '../src/client/config-form.ts';
import { ModelDefaults } from '../src/client/model-defaults.ts';
import { DEFAULT_CONFIG } from '../src/config.ts';
import { makeClientCtx, makeConfigFormScope } from './helpers.ts';

/** 构造配置页表单与默认模型目录。 */
function setup(error = false) {
  const ctx = makeClientCtx();
  const modelCatalog = vi.spyOn(ctx.remote.session, 'modelCatalog');
  if (error) modelCatalog.mockRejectedValue(new Error('catalog offline'));
  else
    modelCatalog.mockResolvedValue({
      ok: true,
      value: {
        default: { provider: 'deepseek', model: 'deepseek-chat' },
        routableProviders: ['deepseek'],
        groups: [
          {
            id: 'deepseek',
            name: 'DeepSeek',
            models: [
              {
                provider: 'deepseek',
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                reasoning: {
                  efforts: [{ id: 'high', name: 'High' }],
                  defaultEffort: 'high',
                },
              },
            ],
          },
        ],
        failures: [],
      },
    });
  const scope = makeConfigFormScope<ConfigFields>({ value: { ...DEFAULT_CONFIG } });
  const form = new PluginConfigForm(scope.scope);
  const actions = form.inject();
  const models = new ModelDefaults(ctx, actions.hooks.configForm, actions.edit);
  return { ctx, scope, form, actions, models, modelCatalog };
}

describe('默认模型目录', () => {
  it('加载模型目录并把选择写入草稿', async () => {
    const { actions, models } = setup();
    const injected = models.inject(
      (key) => key,
      (text) => String(text),
    );
    await vi.waitFor(() => {
      expect(injected.directory.getSnapshot().status).toBe('ready');
    });
    expect(injected.directory.getSnapshot().groups[0]?.name).toBe('DeepSeek');

    await injected.select({
      provider: 'deepseek',
      model: 'deepseek-chat',
      reasoningEffort: 'high',
    });
    expect(actions.hooks.configForm.getSnapshot().session_provider.text).toBe('deepseek');
    expect(actions.hooks.configForm.getSnapshot().session_model.text).toBe('deepseek-chat');
    expect(actions.hooks.configForm.getSnapshot().session_effort.text).toBe('high');
    expect(injected.directory.getSnapshot().current).toEqual({
      provider: 'deepseek',
      model: 'deepseek-chat',
      reasoningEffort: 'high',
    });
  });

  it('模型切换省略 effort 时清空已保存等级', async () => {
    const { scope, actions, models } = setup();
    const injected = models.inject(
      (key) => key,
      (text) => String(text),
    );
    await injected.select({
      provider: 'deepseek',
      model: 'deepseek-chat',
      reasoningEffort: 'high',
    });
    scope.publish({
      value: {
        ...DEFAULT_CONFIG,
        session_provider: 'deepseek',
        session_model: 'deepseek-chat',
        session_effort: 'high',
      },
    });

    await injected.select({ provider: 'deepseek', model: 'deepseek-chat' });
    expect(actions.hooks.configForm.getSnapshot().session_effort.text).toBe('');
    expect(injected.directory.getSnapshot().current).toEqual({
      provider: 'deepseek',
      model: 'deepseek-chat',
    });
  });

  it('目录失败进入官方错误状态', async () => {
    const { models } = setup(true);
    const injected = models.inject(
      (key) => key,
      (text) => String(text),
    );
    await vi.waitFor(() => {
      expect(injected.directory.getSnapshot().status).toBe('error');
    });
    expect(injected.directory.getSnapshot().error).toContain('catalog offline');
  });

  it('卸载后不再跟随配置变化', async () => {
    const { actions, models } = setup();
    const injected = models.inject(
      (key) => key,
      (text) => String(text),
    );
    await injected.select({ provider: 'deepseek', model: 'deepseek-chat' });
    models.dispose();

    actions.edit('session_model', 'changed');
    expect(injected.directory.getSnapshot().current?.model).toBe('deepseek-chat');
  });
});
