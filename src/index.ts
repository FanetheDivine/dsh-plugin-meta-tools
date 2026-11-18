/**
 * 插件入口。导出宿主约定的 name、inject、apply 与 Config。
 * apply 读取配置、按可用服务建立工具组，并在配置热重载时重建注册。
 */
import { type PluginConfig, readConfig } from './config.ts';
import {
  PLUGIN_LABEL,
  SESSION_TOOL_NAMES,
  TOOL_NAMES,
  type ToolName,
  WORKSPACE_TOOL_NAMES,
} from './constants.ts';
import { buildSessionTool } from './session-tools.ts';
import type { Context, SessionQueryLike, WorkspaceRegistryLike } from './types.ts';
import { buildWorkspaceTool } from './workspace-tools.ts';

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
 * 插件启用时调用：读取配置、按服务建立工具组并监听热重载。
 * `config` 的字段是热重载引用，保存配置后宿主触发 loader/volatile-update。
 */
export function apply(ctx: Context, config?: unknown): void {
  let current: Readonly<PluginConfig> = readConfig(config);
  /** 各服务组的同步函数：配置变化时逐组释放旧注册并按新开关注册。 */
  const groups: Array<() => void> = [];

  /** 打印当前开启的工具。 */
  const logState = (): void => {
    ctx.logger.info(`[${PLUGIN_LABEL}] apply: enabled=${enabledTools(current).join(',')}`);
  };

  ctx.inject(['workspaceRegistry'], (scoped) => {
    const registry = scoped.get('workspaceRegistry') as WorkspaceRegistryLike | undefined;
    if (registry === undefined) return;
    const disposers: Array<() => void> = [];
    /** 释放旧注册并按当前开关注册工作区工具。 */
    const sync = (): void => {
      for (const dispose of disposers.splice(0)) dispose();
      for (const tool of WORKSPACE_TOOL_NAMES) {
        if (!current[tool]) continue;
        disposers.push(scoped.tools.register(buildWorkspaceTool(tool, { ctx: scoped, registry })));
      }
    };
    groups.push(sync);
    sync();
    scoped.effect(
      () => () => {
        for (const dispose of disposers.splice(0)) dispose();
        const index = groups.indexOf(sync);
        if (index >= 0) groups.splice(index, 1);
      },
      'dsh-plugin-meta-tools: workspace tools',
    );
  });

  ctx.inject(['sessionQuery'], (scoped) => {
    const sessionQuery = scoped.get('sessionQuery') as SessionQueryLike | undefined;
    if (sessionQuery === undefined) return;
    const disposers: Array<() => void> = [];
    /** 释放旧注册并按当前开关注册会话工具。 */
    const sync = (): void => {
      for (const dispose of disposers.splice(0)) dispose();
      for (const tool of SESSION_TOOL_NAMES) {
        if (!current[tool]) continue;
        disposers.push(
          scoped.tools.register(buildSessionTool(tool, { ctx: scoped, sessionQuery })),
        );
      }
    };
    groups.push(sync);
    sync();
    scoped.effect(
      () => () => {
        for (const dispose of disposers.splice(0)) dispose();
        const index = groups.indexOf(sync);
        if (index >= 0) groups.splice(index, 1);
      },
      'dsh-plugin-meta-tools: session tools',
    );
  });

  ctx.on('loader/volatile-update', () => {
    try {
      current = readConfig(config);
    } catch (error) {
      ctx.logger.warn(`[${PLUGIN_LABEL}] config update ignored: ${String(error)}`);
      return;
    }
    logState();
    for (const sync of [...groups]) sync();
  });

  logState();
}
