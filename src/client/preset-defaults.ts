/**
 * 配置页的预设目录：读取宿主预设名册，把选择写入配置草稿。
 * 导出 PresetDefaults、PresetDefaultsInjected 与 PresetDefaultsState。
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store';

import type { AgentPresetRowLike } from '../types.ts';
import type { ConfigFormState } from './config-form.ts';

/** 名册读取的四种结果。 */
export type PresetRosterStatus = 'loading' | 'ready' | 'noService' | 'error';

/** 配置页预设选择器读取的状态。 */
export interface PresetDefaultsState {
  /** 名册读取状态。 */
  status: PresetRosterStatus;
  /** 读取失败时的说明。 */
  error: string | null;
  /** 可用预设，按宿主顺序。 */
  rows: readonly AgentPresetRowLike[];
  /** 配置草稿中的预设标识；空值表示跟随宿主默认。 */
  current: string;
}

/** 配置页预设选择器使用的注入值。 */
export interface PresetDefaultsInjected {
  /** 选择器读取的状态。 */
  hooks: { presetDefaults: SnapshotStore<PresetDefaultsState> };
  /** 重新读取宿主名册。 */
  load: () => void;
  /** 把选择写入配置草稿。 */
  select: (id: string) => void;
}

/** 一次名册读取的返回值形状。 */
type RosterRead =
  | { ok: true; value: { readonly presets: readonly AgentPresetRowLike[] } }
  | { ok: false; error: { readonly code: string; readonly message: string } };

/** 浏览器侧的预设目录远程命名空间。 */
interface PresetRemoteLike {
  list(): Promise<RosterRead>;
}

/** 读取 `ctx.remote.agentPresets`；宿主未提供时返回 undefined。 */
function presetRemote(ctx: Context): PresetRemoteLike | undefined {
  const remote = (ctx.remote as unknown as { agentPresets?: Partial<PresetRemoteLike> })
    .agentPresets;
  return remote !== undefined && typeof remote.list === 'function'
    ? (remote as PresetRemoteLike)
    : undefined;
}

/** 保存名册、配置草稿与选择器共享状态的订阅。 */
export class PresetDefaults {
  private readonly store: SnapshotStore<PresetDefaultsState> = createSnapshotStore({
    status: 'loading',
    error: null,
    rows: [],
    current: '',
  });
  private readonly disposers: Array<() => void> = [];
  private reading = false;

  /**
   * @param ctx - 前端根上下文，提供预设名册与连接事件。
   * @param form - 配置页草稿状态。
   * @param edit - 配置页草稿编辑动作。
   */
  constructor(
    private readonly ctx: Context,
    private readonly form: SnapshotStore<ConfigFormState>,
    private readonly edit: (field: string, text: string) => void,
  ) {
    this.disposers.push(form.subscribe(() => this.sync()));
    this.disposers.push(ctx.on('connection/reset', () => this.load()));
    this.sync();
  }

  /** @returns 配置页选择器的注入值。 */
  inject(): PresetDefaultsInjected {
    return {
      hooks: { presetDefaults: this.store },
      load: () => this.load(),
      select: (id) => this.edit('session_preset', id),
    };
  }

  /** 释放对配置草稿与连接事件的订阅。 */
  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }

  /** 读取宿主的可用预设；失败时保留已保存值。 */
  async load(): Promise<void> {
    if (this.reading) return;
    const remote = presetRemote(this.ctx);
    if (remote === undefined) {
      this.store.update((state) => {
        state.status = 'noService';
        state.error = null;
      });
      return;
    }
    this.reading = true;
    this.store.update((state) => {
      state.status = 'loading';
      state.error = null;
    });
    try {
      const result = await remote.list();
      if (result.ok) {
        const rows = result.value.presets.filter((row) => row.broken === undefined);
        this.store.update((state) => {
          state.status = 'ready';
          state.rows = rows;
        });
      } else if (result.error.code === 'gateway/invocation-unavailable') {
        this.store.update((state) => {
          state.status = 'noService';
          state.error = null;
        });
      } else {
        this.store.update((state) => {
          state.status = 'error';
          state.error = result.error.message;
        });
      }
    } catch (error) {
      this.store.update((state) => {
        state.status = 'error';
        state.error = error instanceof Error ? error.message : String(error);
      });
    } finally {
      this.reading = false;
    }
  }

  /** 从配置草稿重建当前选择。 */
  private sync(): void {
    const current = this.form.getSnapshot().session_preset?.text ?? '';
    this.store.update((state) => {
      state.current = current.trim();
    });
  }
}
