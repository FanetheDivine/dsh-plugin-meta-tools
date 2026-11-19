/**
 * 配置页的模型目录与草稿状态：复用宿主模型目录，读取插件默认模型，并把选择写入配置草稿。
 * 导出 ModelDefaults、ModelDefaultsInjected。
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ModelCatalogModel, ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store';
import { ModelCatalogDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/src/client/catalog.ts';
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/src/client/directory.ts';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';

import type { ConfigFormState } from './config-form.ts';

/** 配置页默认模型选择器使用的注入值。 */
export interface ModelDefaultsInjected {
  /** 官方选择器读取的目录状态。 */
  directory: SnapshotStore<ModelDirectoryState>;
  /** 加载或重试模型目录。 */
  load: () => void;
  /** 把选择写入配置草稿。 */
  select: (selection: ModelSelection) => Promise<{ ok: true; value: undefined }>;
  /** 官方选择器的文案。 */
  t: TranslateNS<'model'>;
  /** 解析模型徽标文案。 */
  resolveText: (text: NonNullable<ModelCatalogModel['badge']>['text']) => string;
}

/** 保存模型目录、配置草稿与选择器共享状态的订阅。 */
export class ModelDefaults {
  private readonly catalog: ModelCatalogDirectory;
  private readonly store: SnapshotStore<ModelDirectoryState> = createSnapshotStore({
    current: null,
    routable: null,
    groups: [],
    failures: [],
    status: 'idle',
    pending: null,
    error: null,
  });
  private readonly disposers: Array<() => void> = [];

  /**
   * @param ctx - 前端根上下文，提供模型目录与连接事件。
   * @param form - 配置页草稿状态。
   * @param edit - 配置页草稿编辑动作。
   */
  constructor(
    ctx: Context,
    private readonly form: SnapshotStore<ConfigFormState>,
    private readonly edit: (field: string, text: string) => void,
  ) {
    this.catalog = new ModelCatalogDirectory(ctx);
    this.disposers.push(this.catalog.store.subscribe(() => this.sync()));
    this.disposers.push(form.subscribe(() => this.sync()));
    this.disposers.push(
      ctx.on('connection/reset', () => {
        this.catalog.resetGeneration();
      }),
    );
    for (const event of [
      'llm/adapters-updated',
      'llm/models-updated',
      'settings/document-updated',
      'credentials/record-updated',
      'credentials/reference-updated',
    ] as const) {
      this.disposers.push(
        ctx.remote.$on(event, () => {
          this.catalog.refresh();
        }),
      );
    }
    void this.catalog.load().catch(() => undefined);
    this.sync();
  }

  /** @returns 配置页选择器的注入值。 */
  inject(
    t: TranslateNS<'model'>,
    resolveText: ModelDefaultsInjected['resolveText'],
  ): ModelDefaultsInjected {
    return {
      directory: this.store,
      load: () => {
        void this.catalog.load().catch(() => undefined);
      },
      select: (selection) => this.select(selection),
      t,
      resolveText,
    };
  }

  /** 释放目录、配置与连接事件的订阅。 */
  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
  }

  /** 把选择写入草稿，并立即更新选择器显示。 */
  private select(selection: ModelSelection): Promise<{ ok: true; value: undefined }> {
    this.store.update((state) => {
      state.pending = selection;
      state.status = 'selecting';
      state.error = null;
    });
    this.edit('session_provider', selection.provider);
    this.edit('session_model', selection.model);
    this.edit('session_effort', selection.reasoningEffort ?? '');
    this.store.update((state) => {
      state.pending = null;
      state.status = 'ready';
    });
    return Promise.resolve({ ok: true, value: undefined });
  }

  /** 从目录与配置草稿重建选择器状态。 */
  private sync(): void {
    const config = this.form.getSnapshot();
    const catalog = this.catalog.store.getSnapshot();
    const provider = config.session_provider?.text ?? '';
    const model = config.session_model?.text ?? '';
    const effort = config.session_effort?.text ?? '';
    const current =
      provider === '' || model === ''
        ? null
        : { provider, model, ...(effort === '' ? {} : { reasoningEffort: effort }) };
    const groups = catalog.value?.groups ?? [];
    const routable =
      current === null || catalog.status !== 'ready'
        ? null
        : groups.some(
            (group) =>
              group.id === current.provider &&
              group.models.some((entry) => entry.id === current.model),
          );
    this.store.update((state) => {
      state.current = current;
      if (effort === '') delete state.retainedEffort;
      else state.retainedEffort = effort;
      state.routable = routable;
      state.groups = groups;
      state.failures = catalog.value?.failures ?? [];
      state.status =
        catalog.status === 'error' ? 'error' : catalog.status === 'ready' ? 'ready' : 'loading';
      state.error = catalog.error;
    });
  }
}
