/**
 * 预设选择器：右侧 select 触发器，浮窗使用宿主自带 Menu。
 * 导出 PresetSelect 与 props。
 */
import {
  IconChevronDownOutlineRegular,
  Menu,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { useRef, useState, useSyncExternalStore } from 'react';
import type { NS } from './locales.ts';
import type { PresetDefaultsInjected, PresetDefaultsState } from './preset-defaults.ts';
import css from './preset-select.module.css';

/** 预设选择器 props：目录状态、动作、只读开关与字典。 */
export interface PresetSelectProps extends PresetDefaultsInjected {
  /** 配置页不可编辑或保存中时为 true。 */
  locked: boolean;
  /** 本插件前端字典。 */
  t: TranslateNS<typeof NS>;
}

/** 当前选择的显示文案。 */
export function currentText(state: PresetDefaultsState, t: TranslateNS<typeof NS>): string {
  if (state.status === 'loading') return t('config.sessionPreset.loading');
  if (state.status === 'noService') return t('config.sessionPreset.noService');
  if (state.status === 'error') return t('config.sessionPreset.loadFailed');
  if (state.current === '') return t('config.sessionPreset.followHost');
  const row = state.rows.find((entry) => entry.id === state.current);
  if (row === undefined) return `${state.current} · ${t('config.sessionPreset.unavailable')}`;
  const name = row.name?.trim();
  return name === undefined || name === '' ? row.id : name;
}

/** 菜单项：先“跟随宿主默认”，再列出可用预设，不可用的已存值以禁用项补足。 */
export function menuItems(state: PresetDefaultsState, t: TranslateNS<typeof NS>): MenuEntry[] {
  const items: MenuEntry[] = [
    { id: '', label: t('config.sessionPreset.followHost') },
    ...state.rows.map((row) => ({ id: row.id, label: row.name?.trim() || row.id })),
  ];
  if (
    state.status === 'ready' &&
    state.current !== '' &&
    !state.rows.some((row) => row.id === state.current)
  ) {
    items.push({
      id: state.current,
      label: `${state.current} · ${t('config.sessionPreset.unavailable')}`,
      disabled: true,
    });
  }
  return items;
}

/**
 * 渲染预设行右侧的选择控制。
 * @param props - 名册状态、选择动作、只读开关与字典。
 * @returns 触发器、可选的重试提示与浮窗菜单。
 */
export function PresetSelect({ hooks, load, select, locked, t }: PresetSelectProps) {
  const state = useSyncExternalStore(
    (notify) => hooks.presetDefaults.subscribe(notify),
    () => hooks.presetDefaults.getSnapshot(),
    () => hooks.presetDefaults.getSnapshot(),
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const editable = !locked && state.status === 'ready';

  return (
    <>
      <Menu
        open={open}
        anchor={
          <button
            ref={triggerRef}
            type="button"
            className={css.trigger}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={t('config.sessionPreset.menuLabel')}
            disabled={!editable}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={css.label}>{currentText(state, t)}</span>
            <IconChevronDownOutlineRegular className={css.chevron} size={14} aria-hidden="true" />
          </button>
        }
        items={menuItems(state, t)}
        selectedId={state.current}
        onSelect={(id) => {
          select(id);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        returnFocus={() => triggerRef.current}
        portal
        align="start"
        className={css.root}
      />
      {state.status === 'error' && (
        <p className={css.notice} role="alert">
          {state.error ?? t('config.sessionPreset.loadFailed')}
          <button type="button" className={css.retry} onClick={load}>
            {t('config.sessionPreset.retry')}
          </button>
        </p>
      )}
    </>
  );
}
