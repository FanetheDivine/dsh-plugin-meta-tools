# Tasks: 配置新增会话的预设

**Input**: Design documents from `specs/026-session-agent-preset/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/config-page.md、contracts/session-create.md

**Tests**: 宪章要求代码变更同步测试。本列表采用测试先行。

**Organization**: 三个阶段分别交付依赖升级、配置页预设选择与新建会话预设解析；每个阶段形成一个 commit。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 不同文件且无未完成依赖，可并行执行。
- **[Story]**: US1 为配置页预设选择，US2 为新建会话解析，US3 为不可用状态与降级。
- 所有路径均相对于仓库根目录。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 把依赖对齐到宿主 0.2.2-rc.5，并确认 rc.5 的客户端包布局仍支持现有导入。

- [ ] T001 在 `package.json` 把全部 `@deepseek-ai/dsh-*` devDependencies 升级到 `0.2.2-rc.5`，新增 `@deepseek-ai/dsh-agent-preset-registry@0.2.2-rc.5`，并在 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 增加新包条目
- [ ] T002 运行 `pnpm install`，核对 rc.5 的 `dsh-client-ui-primitives`、`dsh-client-store`、`dsh-client-ui-model-selection` 源码路径与导出；按实际路径修正 `vitest.config.ts` 别名与 `tests/support/primitives.ts`
- [ ] T003 运行 `pnpm check` 并提交 Phase 1（提交说明包含依赖升级范围）

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 两端共用的配置字段、类型与字典。

- [ ] T004 [P] 在 `tests/config.test.ts` 增加 `session_preset` 缺省值、字符串校验、空白与非法类型测试
- [ ] T005 在 `src/constants.ts`、`src/config.ts` 增加 `session_preset`：默认空字符串、volatile、仅字符串校验、不参与成对校验，并扩展 `PluginConfig`
- [ ] T006 [P] 在 `tests/config-form.test.ts` 增加草稿字段、保存写操作与恢复测试
- [ ] T007 在 `src/client/config-form.ts` 把 `session_preset` 纳入 `ConfigFields` 与 `FIELD_SPECS`
- [ ] T008 在 `src/types.ts` 增加 `AgentPresetRowLike` 与 `AgentPresetsLike`（`list()` 返回含 `id`、`name`、`description`、`broken` 的行），供后端与客户端共用

## Phase 3: User Story 1 - 在配置页选择新增会话的预设 (Priority: P1) 🎯 MVP

**Goal**: “新增会话”区域显示“模型”与“预设”两行，预设行用 select 触发器与官方 Menu 选择预设。

**Independent Test**: 打开配置页检查两行文案与位置，选择预设并保存，重开配置页选择保持。

- [ ] T009 [P] [US1] 在 `tests/preset-defaults.test.ts` 增加名册读取、选择写入草稿、未选择与卸载测试
- [ ] T010 [US1] 在 `src/client/preset-defaults.ts` 实现名册读取与草稿投影：`ctx.remote.agentPresets.list()`、当前值与可用性、`load` 与 `select`
- [ ] T011 [P] [US1] 在 `tests/client.test.ts` 增加“模型”标签、预设行文案、select 触发器与菜单首项断言
- [ ] T012 [US1] 在 `src/client/preset-select.tsx` 用 `Menu` 实现触发器与菜单：首项“跟随宿主默认”，其后可用预设，`selectedId` 取配置值
- [ ] T013 [US1] 在 `src/client/config-page.tsx` 把模型标签改为“模型”，并在模型行下方渲染预设行；在 `src/client/index.ts` 接线 `PresetDefaults`
- [ ] T014 [US1] 在 `src/client/locales.ts` 增加中英文预设文案，并把 `config.sessionModel.label` 改为“模型”/“Model”
- [ ] T015 [US1] 运行聚焦测试、`pnpm format` 与 `pnpm check`，确认通过后提交 Phase 3

## Phase 4: User Story 2 - 新建会话应用默认预设 (Priority: P2)

**Goal**: `session_create` 按“显式参数 > 可用配置值 > 宿主默认”解析预设。

**Independent Test**: 三种状态下新建会话，检查会话记录的预设；配置值不可用时回退宿主默认。

- [ ] T016 [P] [US2] 在 `tests/session-ops.test.ts` 增加显式优先、配置命中、配置不可用回退、名册读取失败回退与未配置兼容测试
- [ ] T017 [US2] 在 `src/session-ops.ts` 的 `SessionControlDeps` 增加可选 `agentPresets`，实现预设解析：显式值直接使用；配置值在可用名册中才使用；其余按空值；只传最终结果给 `sessionController.create`
- [ ] T018 [US2] 在 `src/index.ts` 从 `ctx.get('agentPresets')` 取服务并传给 `session_create`，保持工具注册条件不变
- [ ] T019 [P] [US2] 在 `tests/plugin.test.ts` 增加宿主预设服务到 `session_create` 的接线测试
- [ ] T020 [US2] 运行聚焦测试、`pnpm format` 与 `pnpm check`，确认通过后提交 Phase 4

## Phase 5: User Story 3 - 不可用状态与降级 (Priority: P3)

**Goal**: 名册加载失败、宿主无预设能力与已保存预设不可用时，配置页给出明确状态并可恢复。

**Independent Test**: 分别制造名册失败、无服务与已保存值损坏，检查触发器、说明与重试。

- [ ] T021 [P] [US3] 在 `tests/preset-defaults.test.ts` 增加加载失败、无服务、已保存值不可用与重试测试
- [ ] T022 [P] [US3] 在 `tests/client.test.ts` 增加触发器禁用、不可用标注与说明文案断言
- [ ] T023 [US3] 在 `src/client/preset-defaults.ts` 与 `src/client/preset-select.tsx` 实现 loading/ready/unavailable/noService/error 状态与重试，保留已保存值
- [ ] T024 [US3] 在 `src/client/locales.ts` 增加加载中、失败、重试、不可用与无预设能力文案；在 `src/client/index.ts` 监听连接重置刷新名册
- [ ] T025 [US3] 运行聚焦测试、`pnpm format` 与 `pnpm check`，确认通过后提交 Phase 5

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T026 [P] 更新 `README.md`，说明配置页“模型”与“预设”、默认预设与单次覆盖
- [ ] T027 [P] 更新 `docs/how-it-works.md` 与 `docs/development.md` 的配置键、预设解析顺序与测试地图
- [ ] T028 [P] 更新 `docs/known-risks.md` 与 `CHANGELOG.md` 的宿主名册接口、rc.5 升级风险与回退边界
- [ ] T029 按 `specs/026-session-agent-preset/quickstart.md` 运行 `pnpm format && pnpm check && pnpm full-check`
- [ ] T030 按 `specs/026-session-agent-preset/quickstart.md` 在真实 DSH 验证两行文案、菜单键盘操作、浮层位置、保存与新建会话预设
- [ ] T031 审查 `src/`、`tests/`、`docs/`、`README.md`、`CHANGELOG.md` 与构建配置的最终差异，提交 Phase 6

## Dependencies & Execution Order

- Phase 1 必须先完成，否则 rc.3 与 rc.5 的路径差异会影响后续任务。
- Phase 2 的配置与类型是 Phase 3、Phase 4 的共同前置。
- Phase 3 与 Phase 4 可在 Phase 2 后并行推进；Phase 4 不依赖配置页组件。
- Phase 5 依赖 Phase 3 的选择器与目录状态。
- Phase 6 在全部功能阶段完成后执行。

## Parallel Opportunities

- T004 与 T006 分属不同测试文件。
- T009、T011 分属不同测试文件。
- T016 与 T019 分属不同测试文件。
- T021 与 T022 分属不同测试文件。
- T026、T027、T028 分属不同文档。

## Implementation Strategy

1. 先升级依赖并修复路径漂移，保证后续类型检查可靠。
2. 交付配置页选择器（MVP），用户可设置并保存默认预设。
3. 接入 `session_create` 解析，默认预设开始作用于新建会话。
4. 完成不可用状态与降级，随后跑完整门禁与实机验收。

## Notes

- 配置值只在宿主可用名册中生效；不可用或读取失败时按空值创建。
- 显式 `agent_preset` 保持宿主校验与现有错误行为。
- 选择器只修改草稿，不写入宿主“新任务默认预设”。
- rc.5 包路径与导出以安装后的实际内容为准；发现漂移时先修正测试别名与导入再继续。