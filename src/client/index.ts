/**
 * 浏览器入口：注册配置页文案与插件面板的行配置页。
 * 导出 inject 与 apply。
 */
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-locale/client';
// Type-only：拉取 plugins.row.config 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
// Type-only：拉取 ctx.slots 服务。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
// Type-only：拉取 ctx.configForms 服务。
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import { type ConfigFields, PluginConfigForm, ROW_ID, ROW_KEY } from './config-form.ts';
import { ConfigPage } from './config-page.tsx';
import { en, NS, zh } from './locales.ts';
import { ModelDefaults } from './model-defaults.ts';
import { PresetDefaults } from './preset-defaults.ts';

/** 需要宿主注入的客户端服务。 */
export const inject = ['slots', 'locale', 'configForms', 'remote', 'remote.session'];

/** 插件在前端启用时调用：注册字典与面板配置页。 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-meta-tools: dictionaries');

  // 配置页：宿主为该行提供的表单命名空间是行 id
  const form = new PluginConfigForm(ctx.configForms.get<ConfigFields>(ROW_ID));
  const injected = form.inject();
  const models = new ModelDefaults(ctx, injected.hooks.configForm, injected.edit);
  const presets = new PresetDefaults(ctx, injected.hooks.configForm, injected.edit);
  presets.load();
  const modelT = ctx.locale.bind('model');
  ctx.effect(
    () => () => {
      form.dispose();
      models.dispose();
      presets.dispose();
    },
    'dsh-plugin-meta-tools: config form',
  );
  ctx.slots.inject('plugins.row.config', () =>
    ctx.slots.register(
      {
        name: 'plugins.row.config',
        key: ROW_KEY,
        locale: NS,
        inject: () => ({
          ...injected,
          modelDefaults: models.inject(modelT, (text) => ctx.locale.resolveText(text)),
          presetDefaults: presets.inject(),
        }),
      },
      ConfigPage,
    ),
  );
}
