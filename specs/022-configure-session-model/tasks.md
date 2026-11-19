# Tasks: 配置新增会话的模型

**Input**: Design documents from `specs/022-configure-session-model/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/session-create.md

**Tests**: 宪章要求代码变更同步测试。本列表采用测试先行。

**Organization**: 两个用户故事分别交付工具参数与配置页。每个阶段形成一个 commit。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 不同文件且无未完成依赖，可并行执行。
- **[Story]**: US1 为工具参数，US2 为配置页默认模型。
- 所有路径均相对于仓库根目录。

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 核对并提交 `specs/022-configure-session-model/` 中的 spec、plan、research、data-model、contracts 与 quickstart

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 在 `src/types.ts` 增加最小 `LlmLike.resolveCallConfig` 结构契约并提交本阶段；复用宿主 `ModelSelection`，不增加依赖

## Phase 3: User Story 1 - 按任务选择新会话模型 (Priority: P1) 🎯

**Goal**: 使用 provider/model/effort 创建会话，并从首轮开始应用选择

**Independent Test**: 完整选择依次通过校验、创建、会话选择、标题与首条消息；省略新参数的既有测试保持通过

- [X] T003 [P] [US1] 在 `tests/contract.test.ts` 增加 provider/model/effort 的可选字符串契约、配对说明与工具描述断言
- [X] T004 [P] [US1] 在 `tests/session-ops.test.ts` 增加完整选择、空白参数、不完整组合、校验失败、创建后失败及执行顺序测试
- [X] T005 [P] [US1] 在 `tests/plugin.test.ts` 增加从 `ctx.llm` 到 session_create 的接线测试
- [X] T006 [US1] 在 `src/session-ops.ts` 实现参数校验、创建前 `resolveCallConfig`、创建后 `agent.model.select` 与包含会话 id 的错误
- [X] T007 [US1] 在 `src/index.ts` 传入可选 `llm` 服务，保持现有工具注册条件不变
- [X] T008 [US1] 运行聚焦测试、`pnpm format` 与 `pnpm check`，确认通过后提交本阶段

## Phase 4: User Story 2 - 在插件配置页设置默认模型 (Priority: P2) 🎯 MVP

**Goal**: 通过官方模型选择器设置新增会话默认配置，模型名前显示 provider，不显示团队协作项

**Independent Test**: 配置页选择 provider/model/effort 并保存后，未显式传参的新会话使用默认值；显式参数覆盖默认值

- [X] T009 [P] [US2] 在 `tests/config.test.ts` 与 `tests/session-ops.test.ts` 增加默认模型严格校验、回退与显式覆盖测试
- [X] T010 [P] [US2] 在 `tests/model-defaults.test.ts` 增加目录回显、草稿选择、错误与卸载测试
- [X] T011 [P] [US2] 在 `tests/client.test.ts` 增加配置页分组、provider 标签与空额外选项测试
- [X] T012 [US2] 在 `src/config.ts`、`src/constants.ts` 与 `src/client/config-form.ts` 增加三个 volatile 默认模型字段与严格配对校验
- [X] T013 [US2] 在 `src/client/model-defaults.ts` 复用官方目录并投影配置草稿，选择只编辑表单
- [X] T014 [US2] 在 `src/client/config-page.tsx`、`src/client/index.ts` 与 `src/client/locales.ts` 接入官方选择器、provider 前缀和空额外选项
- [X] T015 [US2] 在 `tsdown.config.ts` 与 `tests/client-bundle.test.ts` 内联官方 CSS 并回归单文件客户端产物
- [X] T016 [US2] 在 `src/session-ops.ts`、`src/index.ts` 与 `tests/plugin.test.ts` 实现默认模型回退、显式覆盖与热更新
- [X] T017 [US2] 更新 `package.json`、`pnpm-workspace.yaml` 并运行聚焦测试、类型检查、peer 检查与 `pnpm build`

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T018 [P] 更新 `README.md`，说明新增会话默认模型与单次覆盖
- [X] T019 [P] 更新 `docs/how-it-works.md` 与 `docs/development.md` 的配置、工具、前端机制与测试地图
- [X] T020 [P] 更新 `docs/known-risks.md` 与 `CHANGELOG.md` 的失败边界、内部接口风险与条目
- [ ] T021 按 `specs/022-configure-session-model/quickstart.md` 运行 `pnpm format && pnpm check && pnpm full-check`
- [ ] T022 按 `specs/022-configure-session-model/quickstart.md` 在真实 DSH 验证官方选择器、provider 前缀、无团队协作项、保存与新建会话默认值
- [ ] T023 审查 `src/`、`tests/`、`docs/`、`README.md`、`CHANGELOG.md` 与构建配置的最终差异，提交本阶段

## Dependencies & Execution Order

- Phase 1 与 Phase 2 已完成。
- Phase 3 已完成并通过全部源码检查。
- Phase 4 已完成实现与聚焦验证，等待 Phase 5 完整门禁与实机验收。
- Phase 5 的 T021 先于 T022，T023 最后执行。

## Parallel Opportunities

- T003、T004、T005 分属不同测试文件。
- T009、T010、T011 分属不同测试文件。
- T018、T019、T020 分属不同文档。

## Implementation Strategy

1. 工具参数提供逐次模型选择。
2. 配置页提供可保存的默认模型，显式参数覆盖默认值。
3. 官方选择器与样式复用宿主版本，内部接口风险单独记录。
4. 完成自动门禁与真实 DSH 验收后提交最终阶段。

## Notes

- provider 与 model 必须成对提供，effort 必须与完整路由同用。
- 省略 effort 时保持宿主 `reasoningEffort` 字段缺省。
- 不使用会保存宿主全局默认的 `sessionController.selectModel`。
- 创建前校验失败不创建会话；创建后选择失败必须返回会话 id。
