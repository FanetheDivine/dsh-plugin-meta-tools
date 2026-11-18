/**
 * 插件入口。导出宿主约定的 name、inject、apply 与 Config。
 * 本阶段先完成配置读取与热重载接线，工具组随后接入。
 */
import { type PluginConfig, readConfig } from './config.ts';
import { PLUGIN_LABEL, type ToolName, TOOL_NAMES } from './constants.ts';
import type { Context } from './types.ts';

export { Config } from './config.ts';

/** 插件名，与 cordis.patch.yml 的 id 一致。 */
export const name = PLUGIN_LABEL;

/** 需要宿主注入的服务；可选服务经 ctx.inject 等待。 */
export const inject = ['tools'];

/** 当前开启的工具名。 */
function enabledTools(config: Readonly<PluginConfig>): ToolName[] {
  return TOOL_NAMES.filter((tool) => config[tool]);
}

/**
 * 插件启用时调用：读取配置并监听热重载。
 * `config` 的字段是热重载引用，保存配置后宿主触发 loader/volatile-update。
 */
export function apply(ctx: Context, config?: unknown): void {
  let current: Readonly<PluginConfig> = readConfig(config);
  const logState = (): void => {
    ctx.logger.info(`[${PLUGIN_LABEL}] apply: enabled=${enabledTools(current).join(',')}`);
  };
  logState();

  ctx.on('loader/volatile-update', () => {
    try {
      current = readConfig(config);
    } catch (error) {
      ctx.logger.warn(`[${PLUGIN_LABEL}] config update ignored: ${String(error)}`);
      return;
    }
    logState();
  });
}