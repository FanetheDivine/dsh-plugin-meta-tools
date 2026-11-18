// 配置页草稿模型测试：六个开关的草稿、保存写操作、恢复默认、放弃与卸载。
import { describe, expect, it } from 'vitest';

import {
  type ConfigFields,
  type ConfigFormState,
  PluginConfigForm,
  ROW_ID,
  ROW_KEY,
} from '../src/client/config-form.ts';
import { TOOL_NAMES } from '../src/constants.ts';
import { makeConfigFormScope } from './helpers.ts';

/** 六个开关全开。 */
const ALL_ON: ConfigFields = {
  workspace_list: true,
  workspace_create: true,
  workspace_remove: true,
  workspace_rename: true,
  session_list: true,
  session_get: true,
};

/** 构造表单与它读取的状态。 */
function setup(initial: { value?: Partial<ConfigFields>; user?: unknown } = {}) {
  const fake = makeConfigFormScope<ConfigFields>({
    value: { ...ALL_ON, ...initial.value },
    base: ALL_ON,
    user: initial.user,
  });
  const form = new PluginConfigForm(fake.scope);
  return { fake, form, state: () => form.inject().hooks.configForm.getSnapshot() };
}

describe('配置页常量', () => {
  it('行键与命名空间与宿主配置一致', () => {
    expect(ROW_KEY).toBe('dsh-plugin-meta-tools#dsh-plugin-meta-tools');
    expect(ROW_ID).toBe('dsh-plugin-meta-tools');
  });
});

describe('配置页草稿', () => {
  it('六个开关默认开启，起初不脏', () => {
    const current = setup().state();
    for (const tool of TOOL_NAMES) expect(current[tool].text).toBe('true');
    expect(current.dirty).toBe(false);
    expect(current.invalid).toBe(false);
    expect(current.available).toBe(true);
  });

  it('命名空间未下发时不可用', () => {
    const fake = makeConfigFormScope<ConfigFields>({ status: 'unavailable' });
    const form = new PluginConfigForm(fake.scope);
    const current: ConfigFormState = form.inject().hooks.configForm.getSnapshot();
    expect(current.available).toBe(false);
  });

  it('关闭一个开关后草稿变脏', () => {
    const { form, state } = setup();
    form.inject().edit('session_get', 'false');
    expect(state().session_get.text).toBe('false');
    expect(state().dirty).toBe(true);
    expect(state().invalid).toBe(false);
  });
});

describe('配置页保存', () => {
  it('保存两个开关，一次写入两个 set 操作', async () => {
    const { fake, form, state } = setup();
    const actions = form.inject();
    actions.edit('session_get', 'false');
    actions.edit('workspace_list', 'false');

    await actions.save();
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]).toEqual(
      expect.arrayContaining([
        { op: 'set', path: ['workspace_list'], value: false },
        { op: 'set', path: ['session_get'], value: false },
      ]),
    );
    expect(state().dirty).toBe(false);
    expect(state().failed).toBe(false);
  });

  it('恢复默认提交清除操作', async () => {
    const { fake, form, state } = setup({ user: { session_get: false } });
    const actions = form.inject();
    expect(state().session_get.overridden).toBe(true);

    actions.resetField('session_get');
    expect(state().session_get.text).toBe('true');
    expect(state().session_get.overridden).toBe(false);

    await actions.save();
    expect(fake.writes).toEqual([[{ op: 'unset', path: ['session_get'] }]]);
  });

  it('放弃草稿回到宿主值', () => {
    const { form, state } = setup();
    const actions = form.inject();
    actions.edit('session_get', 'false');
    expect(state().dirty).toBe(true);

    actions.discard();
    expect(state().dirty).toBe(false);
    expect(state().session_get.text).toBe('true');
  });

  it('只读部署不写入', async () => {
    const fake = makeConfigFormScope<ConfigFields>({ value: ALL_ON, writable: false });
    const form = new PluginConfigForm(fake.scope);
    const actions = form.inject();
    actions.edit('session_get', 'false');

    await actions.save();
    expect(fake.writes).toEqual([]);
  });
});

describe('配置页卸载', () => {
  it('卸载后宿主快照变化不再更新状态', () => {
    const { fake, form, state } = setup();
    const before = state();
    form.dispose();

    fake.publish({ value: { ...ALL_ON, session_get: false } });
    expect(state()).toBe(before);
  });
});
