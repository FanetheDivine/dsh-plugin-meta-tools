import { createElement, Fragment } from 'react';

/**
 * 测试使用的平台组件入口：直接把 `@deepseek-ai/dsh-client-ui-primitives` 指向包的源码。
 * 已发布的 lib 内联了未声明的第三方依赖（shiki、katex 等），源码只依赖 react、clsx
 * 与 dsh-client-store；vitest 能处理源码里的 CSS Module。
 */

export { Switch } from '@deepseek-ai/dsh-client-ui-primitives/src/Switch.tsx';
export type { SettingsFieldProps } from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/fields.tsx';
export {
  SettingsSecretField,
  SettingsValueField,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/fields.tsx';
export type {
  SettingsFieldSpec,
  SettingsFieldState,
  SettingsFieldWrite,
  SettingsFormActions,
  SettingsFormPathOp,
  SettingsFormScope,
  SettingsFormScopeSnapshot,
  SettingsFormShell,
  SettingsSecretSpec,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/form-model.ts';
export {
  SettingsFormModel,
  settingsNumberField,
  settingsTextField,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/form-model.ts';
export type {
  SettingsFormLabels,
  SettingsFormProps,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/SettingsForm.tsx';
export { SettingsForm } from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/SettingsForm.tsx';

/** 精简的 Menu 桩：渲染 anchor，打开时平铺菜单项，供配置页静态渲染断言。 */
export interface MenuEntry {
  id: string;
  label: unknown;
  disabled?: boolean;
}

export function Menu({
  open,
  anchor,
  items = [],
}: {
  open: boolean;
  anchor: unknown;
  items?: readonly MenuEntry[];
}) {
  const list = open
    ? createElement(
        'div',
        { role: 'menu' },
        items.map((item) =>
          createElement(
            'button',
            { key: item.id, type: 'button', disabled: item.disabled },
            item.label,
          ),
        ),
      )
    : null;
  return createElement(Fragment, null, anchor, list);
}

/** 图标桩：静态渲染不需要真实 SVG。 */
export function IconChevronDownOutlineRegular() {
  return null;
}
