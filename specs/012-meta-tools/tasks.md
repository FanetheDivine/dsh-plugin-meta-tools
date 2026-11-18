# Tasks: 模板转化为工作区与会话工具插件

**Input**: Design documents from `/specs/012-meta-tools/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/

**Tests**: 规格 FR-019 要求测试同步，因此每个用户故事阶段都包含测试任务。

**Organization**: 按用户故事分阶段；每个阶段结束提交一次。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事
- 每个任务给出确切文件路径

## Phase 1: Setup（仓库标识与展示资源）

**Purpose**: 把包身份、插件行与展示资源改为实际插件，并移除示例入口文件。

- [ ] T001 更新 `package.json`：包名 `dsh-plugin-meta-tools`、描述、关键词、`icon`、`exports`（新增 `./locale/*.json` 与 `./icon`）、`files`（新增 `locale/*.json` 与 `icon.svg`）；`dsh.client.inject` 移除 `@deepseek-ai/dsh-client-ui-conversation`
- [ ] T002 更新 `cordis.patch.yml` 的行 id 与 name 为 `dsh-plugin-meta-tools`；更新 `tsdown.config.ts` 的 `CLIENT_ID` 与两组构建名
- [ ] T003 [P] 新增 `locale/en.json`、`locale/zh.json`（插件页标题与描述）与 `icon.svg`
- [ ] T004 [P] 删除 `src/demo-tool.ts`、`src/events.ts`、`src/client/demo-dock.tsx`
- [ ] T005 从 `package.json` 与 `pnpm-lock.yaml` 移除不再使用的 `zod` 依赖
- [ ] T006 本阶段提交：`feat(meta-tools): convert package identity and remove template demo`

## Phase 2: Foundational（阻塞所有用户故事）

**Purpose**: 配置、常量、类型与测试基础设施。

- [ ] T007 重写 `src/constants.ts`：插件标识、六个工具名、`TITLES_PAGE_LIMIT=40`、`MESSAGE_TEXT_LIMIT=2000`、`MESSAGES_TOTAL_LIMIT=12000`
- [ ] T008 重写 `src/types.ts`：再导出 `Context`、`ToolDefinition`、`ToolRunContext`、`Agent`、`Volatile`；新增工作区与会话服务的最小结构接口（`WorkspaceLike`、`WorkspaceRegistryLike`、`SessionQueryLike`、`SessionRecordLike`、`SessionSurfaceLike`、`SessionHeaderLike`、`SurfaceEventLike`）
- [ ] T009 重写 `src/utils.ts`：`isRecord`、`iso`（epoch 毫秒转 ISO-8601）、`clamp`（取整并夹在区间内）、`textOf`（拼接 text 块并去首尾空白）
- [ ] T010 重写 `src/config.ts`：六个布尔热重载字段（默认 `true`）、`DEFAULT_CONFIG`、严格 `resolveConfig`（未知键、非布尔、非对象报错；`null`/缺省取默认；返回冻结对象）与 `readConfig`
- [ ] T011 扩展 `tests/helpers.ts` 的宿主 ctx 模拟：`inject(name, cb)` 在服务可用时调用回调、`get(name)`、`_services` 装卸、工具注册 disposer 生效；保留事件、effect 与日志记录
- [ ] T012 新增 `tests/config.test.ts`：默认值、六个键覆盖、`null` 取默认、未知键/非布尔/非对象报错、冻结、热重载引用展开与实时读取
- [ ] T013 本阶段提交：`feat(meta-tools): add config, constants and service contracts`

## Phase 3: User Story 1 - 工作区工具 (Priority: P1)

**Goal**: 模型可列出、创建、重命名与移除本 profile 的工作区，行为与基准插件一致。

**Independent Test**: 用假注册表调用四个工具，核对视图、幂等、错误与渲染文本。

- [ ] T014 [P] [US1] 新增 `tests/workspace-tools.test.ts`：列表视图与会话计数、目录缺失、创建幂等、相对路径报错、重命名空标题报错、移除只删注册、渲染文本
- [ ] T015 [US1] 新增 `src/workspace-tools.ts`：`workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename` 的 `defineTool` 定义、工作区视图与四个渲染函数
- [ ] T016 [US1] 新增 `src/index.ts`：入口导出 `name`、`inject = ['tools']`、`apply`、`Config`；`apply` 先 `readConfig`；按服务建立工具组；监听 `loader/volatile-update` 重新读取并同步；接入工作区组
- [ ] T017 [US1] 重写 `tests/plugin.test.ts`：入口契约、默认注册四个工作区工具、关闭开关不注册、重新开启恢复、配置更新失败保持现状
- [ ] T018 [US1] 本阶段提交：`feat(meta-tools): add workspace tools`

## Phase 4: User Story 2 - 会话工具 (Priority: P1)

**Goal**: 模型可列出会话并按 id 读取元数据与最新消息。

**Independent Test**: 用假会话查询调用两个工具，核对筛选、分页、标题失败、截断与预算。

- [ ] T019 [P] [US2] 新增 `tests/session-tools.test.ts`：筛选 `workspace_id`/`cwd`、`limit` 夹取、归档过滤、标题 40 条上限、标题失败附 note、`messages` 0–50、单条 2000 字符截断、12000 字符预算、live 标记与错误文案
- [ ] T020 [US2] 新增 `src/session-tools.ts`：`session_list`、`session_get` 的 `defineTool` 定义、标题折叠读取、消息提取与两个渲染函数
- [ ] T021 [US2] 在 `src/index.ts` 接入会话组：`ctx.inject(['sessionQuery'])`；`ctx.get('sessions')` 读取 live 状态
- [ ] T022 [US2] 扩展 `tests/plugin.test.ts`：缺少 `sessionQuery` 时只注册工作区工具，服务晚到时补注册，服务卸载时释放
- [ ] T023 [US2] 本阶段提交：`feat(meta-tools): add session tools`

## Phase 5: User Story 3 - 插件面板工具开关 (Priority: P2)

**Goal**: 插件面板配置页显示六个以工具名命名的开关，保存后热生效。

**Independent Test**: 渲染配置页并保存一个开关，核对配置写回与工具注册变化。

- [ ] T024 [US3] 重写 `src/client/config-form.ts`：`ROW_KEY`/`ROW_ID` 改为 `dsh-plugin-meta-tools`；`ConfigFields` 与 `ConfigFormState` 含六个布尔字段；六个 `SettingsFieldSpec`
- [ ] T025 [P] [US3] 重写 `src/client/config-page.tsx`：六行「标题 + 说明 + Switch」，沿用官方 `SettingsForm` 与主题令牌；`summary` 文案
- [ ] T026 [US3] 重写 `src/client/locales.ts`：六组标题/说明与表单文案，中英文字典键集一致
- [ ] T027 [US3] 重写 `src/client/index.ts`：注册字典与 `plugins.row.config` 配置页，移除 `conversation.composer.dock` 与 `DemoDock`
- [ ] T028 [P] [US3] 重写 `tests/config-form.test.ts`：六个开关的草稿、保存、放弃、恢复默认与只读状态
- [ ] T029 [US3] 重写 `tests/client.test.ts`：前端服务声明、字典、仅配置页注册、六行渲染与卸载释放
- [ ] T030 [US3] 本阶段提交：`feat(meta-tools): add per-tool config switches`

## Phase 6: User Story 4 - 仓库转化与发布设置 (Priority: P2)

**Goal**: 仓库标识、文档、宪章与发布设置与实际插件一致。

**Independent Test**: 检索模板标识为空；版本、CI 与 spec/changelog 状态符合宪章原则 VII。

- [ ] T031 [US4] 重写 `README.md`：六个工具、配置开关、安装、数据来源与限制
- [ ] T032 [US4] 重写 `docs/how-it-works.md`、`docs/known-risks.md`、`docs/development.md`：机制、风险、开发与文件地图
- [ ] T033 [P] [US4] 修订 `AGENTS.md` 与 `.specify/memory/constitution.md`（1.9.0）：删除示例约定，写入可选服务条款与模板转化后的定位
- [ ] T034 [US4] 执行发布设置：`package.json` 版本改 `0.1.0`；`.github/workflows/ci.yml` 恢复 `if: startsWith(github.ref, 'refs/tags/')` 并删除 `if: false`；删除 `specs/001` 至 `specs/011` 与 `changelogs/` 内容；`CHANGELOG.md` 重置并加入本次条目
- [ ] T035 [P] [US4] 更新 `tests/package-pack.test.ts`：断言 `locale/*.json` 与 `icon.svg` 进包，前端注册 id 为 `dsh-plugin-meta-tools`
- [ ] T036 [P] [US4] 更新 `tests/client-bundle.test.ts`：注册 id 与导出契约
- [ ] T037 [US4] 本阶段提交：`feat(meta-tools): convert docs, constitution and release settings`

## Phase 7: Polish & Cross-Cutting

**Purpose**: 质量门禁与实机验证。

- [ ] T038 运行 `pnpm format` 与 `pnpm check`，修复全部问题
- [ ] T039 运行 `pnpm build` 与 `npm pack --dry-run --json`，核对发布内容
- [ ] T040 [P] 用 `real-device-test` skill 在独立测试 profile 安装并验证六个工具、配置开关、热重载与插件页展示
- [ ] T041 复查 `git diff`，确认无模板示例残留、无本机绝对路径
- [ ] T042 向用户报告验收结果并提醒 npm Trusted Publisher 绑定
- [ ] T043 本阶段提交：`chore(meta-tools): verify build and real device`

## Dependencies

```text
Phase 1 (T001–T005)
  └─ Phase 2 (T006–T012)
       ├─ Phase 3 US1 (T014–T017)
       │    └─ Phase 4 US2 (T019–T022)
       │         └─ Phase 5 US3 (T024–T029)
       └─ Phase 6 US4 (T031–T036) 可与 Phase 5 并行
            └─ Phase 7 (T038–T043)
```

- 前置阻塞：所有用户故事都依赖 Phase 2 的 `config.ts`、`types.ts` 与测试 helper。
- US2 依赖 US1 的 `src/index.ts` 骨架。
- US3 的配置页依赖 Phase 2 的配置键定义。
- US4 的文档与发布设置可与 US3 并行，但需在 Polish 前完成。

## Parallel Execution Examples

```text
# Phase 1: 展示资源与删除示例可并行
T003 locale/*.json、icon.svg 与 T004 删除示例文件同时进行

# Phase 3: 测试与渲染函数可并行起草
T014 tests/workspace-tools.test.ts 与 T015 src/workspace-tools.ts 分别编辑

# Phase 5: 配置页组件与测试可并行
T025 src/client/config-page.tsx 与 T028 tests/config-form.test.ts 分别编辑

# Phase 6: 包内容与前端契约测试可并行
T035 tests/package-pack.test.ts 与 T036 tests/client-bundle.test.ts 分别编辑
```

## Implementation Strategy

- **MVP**: Phase 1–3 交付四个工作区工具，已可独立验证。
- **增量**: 每个阶段结束运行相关测试并提交，避免大块改动。
- **最终**: Phase 7 统一运行质量门禁与实机验证，再交给用户验收。