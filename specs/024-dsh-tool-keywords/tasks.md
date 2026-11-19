# Tasks: 工具描述标明 DSH 归属

**Input**: Design documents from `specs/024-dsh-tool-keywords/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/tool-descriptions.md、quickstart.md

**Tests**: 宪章要求代码变更同步测试。本列表采用测试先行。

**Organization**: 两个用户故事分别交付描述文本与契约防回归。每个阶段形成一个 commit。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 不同文件且无未完成依赖，可并行执行。
- **[Story]**: US1 为描述文本，US2 为契约防回归。
- 所有路径均相对于仓库根目录。

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 核对并提交 `specs/024-dsh-tool-keywords/` 中的 spec、plan、research、data-model、contracts 与 quickstart

## Phase 2: Foundational (Blocking Prerequisites)

本功能没有共享基础设施，跳过本阶段。

## Phase 3: User Story 1 - AI 认出工具属于当前 DSH (Priority: P1) 🎯 MVP

**Goal**: 十一条顶层描述各自包含 `DSH (DeepSeek Harness)`，并按工具类型限定 workspace 或 session

**Independent Test**: 读取十一条描述，全部命中词串；在真实 DSH 中用 DSH 与 DeepSeek Harness 请求触发工具

- [ ] T002 [P] [US1] 在 `tests/contract.test.ts` 把 `DESCRIPTIONS` 更新为 `contracts/tool-descriptions.md` 的完整文本，先看到失败
- [ ] T003 [P] [US1] 改写四条工作区描述 in `src/workspace-tools.ts`
- [ ] T004 [P] [US1] 改写 `session_list` 描述 in `src/session-tools.ts`
- [ ] T005 [P] [US1] 改写 `session_create`、`session_stop`、`session_send`、`session_pin`、`session_archive` 描述 in `src/session-ops.ts`
- [ ] T006 [P] [US1] 改写 `session_get` 描述 in `src/session-log.ts`
- [ ] T007 [US1] 运行 `pnpm test:code -- contract` 与 `pnpm run typecheck`，确认十一条描述断言通过后提交本阶段

## Phase 4: User Story 2 - 描述改动不影响调用契约 (Priority: P2)

**Goal**: 契约测试锁定 DSH 词串，新增工具缺少词串时失败；参数、输出与错误断言保持不变

**Independent Test**: 运行契约测试全部通过；临时移除一条描述中的 DSH 词后测试失败，还原后恢复通过

- [ ] T008 [US2] 在 `tests/contract.test.ts` 新增逐工具断言：包含 `DSH`、`DeepSeek Harness`，工作区用 `DSH (DeepSeek Harness) workspace`，会话用 `DSH (DeepSeek Harness) session`
- [ ] T009 [US2] 临时删除一条描述中的 DSH 词，确认测试失败；还原后重新运行 `pnpm test:code -- contract`
- [ ] T010 [US2] 运行 `pnpm check`，确认参数、输出与错误断言未变后提交本阶段

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T011 [P] 在 `CHANGELOG.md` 的 Unreleased 下增加 Changed 条目
- [ ] T012 运行 `pnpm format && pnpm check && pnpm full-check`
- [ ] T013 按 `specs/024-dsh-tool-keywords/quickstart.md` 在真实 DSH 验证 AI 选择工具与开关行为
- [ ] T014 审查 `src/`、`tests/`、`CHANGELOG.md` 与 `specs/024-dsh-tool-keywords/` 的最终差异，提交本阶段

## Dependencies & Execution Order

- Phase 1 先提交设计文档。
- Phase 3 的 T003 至 T006 分属不同源码文件，可并行；T007 依赖全部改写与 T002。
- Phase 4 的 T008 依赖 T002 与 T007。
- Phase 5 的 T012 依赖 Phase 3 与 Phase 4 完成；T013 依赖 T012；T014 最后执行。

## Parallel Opportunities

- T003、T004、T005、T006 分属四个源码文件。
- T011 可与其他文档检查并行。

## Implementation Strategy

1. 先锁定契约测试的期望文本，再改四条描述文件。
2. 用词串断言覆盖未来新增工具。
3. 完成自动门禁与真实 DSH 验收后提交最终阶段。

## Notes

- 描述保持英文，只改顶层描述。
- 工具名、参数名、参数描述、输出、错误、配置与插件元数据保持不变。
- 真实 DSH 验收使用 `real-device-test` 流程。
