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
  it('默认配置打印十一个开启的工具', () => {
    const ctx = makeCtx();
    apply(ctx, {});
    const infos = ctx._loggerCalls.filter((call) => call.level === 'info');
    expect(String(infos[0]?.args[0])).toContain(
      'enabled=workspace_list,workspace_create,workspace_remove,workspace_rename,session_list,session_get,session_create,session_stop,session_send,session_pin,session_archive',
    );
  });

  it('工作区服务可用时注册四个工作区工具与置顶、归档', () => {
    const ctx = makeCtx();
    ctx._setService('workspaceRegistry', {});
    apply(ctx, {});
    expect(ctx._activeToolNames()).toEqual([
      'workspace_list',
      'workspace_create',
      'workspace_remove',
      'workspace_rename',
      'session_pin',
      'session_archive',
    ]);
  });

  it('关闭单个开关只注销该工具', () => {
    const ctx = makeCtx();
    ctx._setService('workspaceRegistry', {});
    apply(ctx, { workspace_list: false, workspace_create: false });
    expect(ctx._activeToolNames()).toEqual([
      'workspace_remove',
      'workspace_rename',
      'session_pin',
      'session_archive',
    ]);
  });

  it('服务晚到时补注册', () => {
    const ctx = makeCtx();
    apply(ctx, {});
    expect(ctx._activeToolNames()).toEqual([]);
    ctx._setService('workspaceRegistry', {});
    expect(ctx._activeToolNames()).toHaveLength(6);
  });

  it('三个服务齐备时注册全部十一个工具', () => {
    const ctx = makeCtx();
    ctx._setService('workspaceRegistry', {});
    ctx._setService('sessionQuery', {});
    ctx._setService('sessionController', {});
    apply(ctx, {});
    expect(ctx._activeToolNames()).toEqual([
      'workspace_list',
      'workspace_create',
      'workspace_remove',
      'workspace_rename',
      'session_pin',
      'session_archive',
      'session_list',
      'session_get',
      'session_create',
      'session_stop',
      'session_send',
    ]);
  });

  it('缺少会话控制服务时不注册三个控制工具', () => {
    const ctx = makeCtx();
    ctx._setService('workspaceRegistry', {});
    ctx._setService('sessionQuery', {});
    apply(ctx, {});
    expect(ctx._activeToolNames()).not.toContain('session_create');
  });

  it('只有 tools 服务时加载成功且不注册工具', () => {
    const ctx = makeCtx();
    apply(ctx, {});
    expect(ctx._activeToolNames()).toEqual([]);
  });

  it('缺少会话服务时只注册工作区工具', () => {
    const ctx = makeCtx();
    ctx._setService('workspaceRegistry', {});
    apply(ctx, {});
    expect(ctx._activeToolNames()).not.toContain('session_list');
  });

  it('开关关闭的会话工具不注册，重新开启后恢复', () => {
    const ctx = makeCtx();
    const config = { session_get: volatile(true) };
    ctx._setService('sessionQuery', {});
    apply(ctx, config);
    expect(ctx._activeToolNames()).toEqual(['session_list', 'session_get']);
    config.session_get.set(false);
    ctx._emit('loader/volatile-update');
    expect(ctx._activeToolNames()).toEqual(['session_list']);
    config.session_get.set(true);
    ctx._emit('loader/volatile-update');
    expect(ctx._activeToolNames()).toEqual(['session_list', 'session_get']);
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
