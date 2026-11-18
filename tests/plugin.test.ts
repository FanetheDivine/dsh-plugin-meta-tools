// 插件入口与接线测试：入口契约、配置读取、热重载事件。
import { describe, expect, it } from 'vitest';

import { Config } from '../src/config.ts';
import { PLUGIN_LABEL } from '../src/constants.ts';
import { apply, inject, name } from '../src/index.ts';
import { makeCtx, volatile } from './helpers.ts';

describe('模块契约', () => {
  it('插件入口导出 name / inject / apply / Config', () => {
    expect(name).toBe(PLUGIN_LABEL);
    expect(name).toBe('dsh-plugin-meta-tools'); // 与 cordis.patch.yml 的 id 一致
    expect(inject).toEqual(['tools']);
    expect(typeof apply).toBe('function');
    expect(typeof Config).toBe('function'); // 宿主据此识别 schema
  });
});

describe('apply 接线', () => {
  it('默认配置打印六个开启的工具', () => {
    const ctx = makeCtx();
    apply(ctx, {});
    const infos = ctx._loggerCalls.filter((call) => call.level === 'info');
    expect(String(infos[0]?.args[0])).toContain(
      'enabled=workspace_list,workspace_create,workspace_remove,workspace_rename,session_list,session_get',
    );
  });

  it('热重载事件读取新配置并更新日志', () => {
    const ctx = makeCtx();
    const config = { session_get: volatile(true), workspace_list: volatile(true) };
    apply(ctx, config);
    config.session_get.set(false);
    ctx._emit('loader/volatile-update');
    const infos = ctx._loggerCalls.filter((call) => call.level === 'info');
    expect(String(infos.at(-1)?.args[0])).toContain('session_list');
    expect(String(infos.at(-1)?.args[0])).not.toContain('session_get');
  });

  it('非法配置更新被忽略并记录警告', () => {
    const ctx = makeCtx();
    const config = { session_get: volatile<unknown>(true) };
    apply(ctx, config);
    config.session_get.set('yes');
    ctx._emit('loader/volatile-update');
    const warns = ctx._loggerCalls.filter((call) => call.level === 'warn');
    expect(warns).toHaveLength(1);
    expect(String(warns[0]?.args[0])).toContain('config update ignored');
    expect(String(warns[0]?.args[0])).toContain('session_get must be a boolean');
  });
});