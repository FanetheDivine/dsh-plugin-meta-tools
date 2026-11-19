// 配置测试：十一个开关的默认值、严格校验、冻结与实时读取。
import { describe, expect, it } from 'vitest';

import {
  Config,
  DEFAULT_CONFIG,
  readConfig,
  resolveConfig,
  sessionModelSelection,
} from '../src/config.ts';
import { PLUGIN_LABEL, SESSION_MODEL_CONFIG_KEYS, TOOL_NAMES } from '../src/constants.ts';
import { volatile } from './helpers.ts';

/** 十一个键的完整配置。 */
const ALL_ON = {
  workspace_list: true,
  workspace_create: true,
  workspace_remove: true,
  workspace_rename: true,
  session_list: true,
  session_get: true,
  session_create: true,
  session_stop: true,
  session_send: true,
  session_pin: true,
  session_archive: true,
  session_provider: '',
  session_model: '',
  session_effort: '',
};

describe('默认值', () => {
  it('十一个工具默认开启', () => {
    expect(resolveConfig({})).toEqual(ALL_ON);
    expect(DEFAULT_CONFIG).toEqual(ALL_ON);
    expect([...TOOL_NAMES, ...SESSION_MODEL_CONFIG_KEYS]).toEqual(Object.keys(ALL_ON));
  });

  it('整份配置留空（undefined/null）时全部用默认值', () => {
    for (const raw of [undefined, null]) {
      expect(resolveConfig(raw)).toEqual(ALL_ON);
      expect(readConfig(raw)).toEqual(ALL_ON);
    }
  });

  it('配置未传时 readConfig 用默认值', () => {
    expect(readConfig(undefined)).toEqual(ALL_ON);
  });
});

describe('覆盖与空值', () => {
  it('单项关闭生效', () => {
    expect(resolveConfig({ session_get: false }).session_get).toBe(false);
    expect(resolveConfig({ session_get: false }).session_list).toBe(true);
  });

  it('null 与 undefined 的键取默认值', () => {
    expect(resolveConfig({ session_get: null }).session_get).toBe(true);
    expect(resolveConfig({ session_get: undefined }).session_get).toBe(true);
  });

  it('返回冻结的完整配置', () => {
    const config = resolveConfig({ session_get: false });
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      (config as unknown as Record<string, boolean>).session_get = true;
    }).toThrow();
  });
});

describe('默认模型', () => {
  it('空配置返回 undefined', () => {
    expect(sessionModelSelection(resolveConfig({}))).toBeUndefined();
  });

  it('读取完整配置并映射 reasoningEffort', () => {
    const config = resolveConfig({
      session_provider: ' deepseek ',
      session_model: ' deepseek-chat ',
      session_effort: ' high ',
    });
    expect(sessionModelSelection(config)).toEqual({
      provider: 'deepseek',
      model: 'deepseek-chat',
      reasoningEffort: 'high',
    });
  });

  it('非字符串、缺少配对或 effort 缺少路由时报错', () => {
    expect(() => resolveConfig({ session_provider: true })).toThrow('must be a string');
    expect(() => resolveConfig({ session_provider: 'deepseek' })).toThrow('must be set together');
    expect(() => resolveConfig({ session_effort: 'high' })).toThrow('requires');
  });
});

describe('严格校验', () => {
  it('未知键报错', () => {
    expect(() => resolveConfig({ bogus: true })).toThrow(
      `${PLUGIN_LABEL}: unknown config key "bogus"`,
    );
  });

  it('非布尔值报错', () => {
    expect(() => resolveConfig({ session_get: 'yes' })).toThrow(
      `${PLUGIN_LABEL}: config session_get must be a boolean`,
    );
    expect(() => resolveConfig({ workspace_list: 1 })).toThrow(
      `${PLUGIN_LABEL}: config workspace_list must be a boolean`,
    );
  });

  it('非对象输入报错', () => {
    expect(() => resolveConfig([])).toThrow(`${PLUGIN_LABEL}: config must be an object`);
    expect(() => resolveConfig('x')).toThrow(`${PLUGIN_LABEL}: config must be an object`);
  });
});

describe('Config schema', () => {
  it('缺省值与实时读取', () => {
    const parsed = Config({});
    expect(parsed.session_get.get()).toBe(true);
    expect(parsed.workspace_rename.get()).toBe(true);
  });

  it('schema 拒绝非法类型', () => {
    expect(() => Config({ session_get: 'yes' })).toThrow();
  });
});

describe('读取实时配置 readConfig', () => {
  it('展开热重载引用', () => {
    const config = { session_get: volatile(false), workspace_list: volatile(true) };
    expect(readConfig(config)).toEqual({ ...ALL_ON, session_get: false });
  });

  it('引用变化后读到新值', () => {
    const sessionGet = volatile(true);
    const config = { session_get: sessionGet };
    expect(readConfig(config).session_get).toBe(true);
    sessionGet.set(false);
    expect(readConfig(config).session_get).toBe(false);
  });

  it('引用值非法时抛错', () => {
    expect(() => readConfig({ session_get: volatile('yes') })).toThrow('must be a boolean');
  });
});
