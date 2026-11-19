# Tasks: 配置新增会话的模型

**Input**: Design documents from `specs/022-configure-session-model/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/session-create.md

**Tests**: 宪章要求代码变更同步测试。本列表采用测试先行。

**Organization**: 只有一个 P1 用户故事。每个阶段形成一个 commit。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 不同文件且无未完成依赖，可并行执行。
- **[Story]**: US1 对应唯一的用户故事。
- 所有路径均相对于仓库根目录。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 固化需求、宿主契约与验证方案

- [X] T001 核对并提交 `specs/022-configure-session-model/` 中的 spec、plan、research、data-model、contracts 与 quickstart

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立会话模型校验服务的最小类型契约

**⚠️ CRITICAL**: 先完成共享类型，再编写行为测试与实现

- [ ] T002 在 `src/types.ts` 增加最小 `LlmLike.resolveCallConfig` 结构契约并提交本阶段；复用宿主 `ModelSelection`，不增加依赖

**Checkpoint**: session_create 可以接收可选 LLM 校验服务，现有运行行为不变

---

## Phase 3: User Story 1 - 按任务选择新会话模型 (Priority: P1) 🎯 MVP

**Goal**: 使用 provider/model/effort 创建会话，并从首轮开始应用选择

**Independent Test**: 完整选择依次通过校验、创建、会话选择、标题与首条消息；省略新参数的既有测试保持通过

### Tests for User Story 1

> 先写测试并确认因功能尚未实现而失败。

- [ ] T003 [P] [US1] 在 `tests/contract.test.ts` 增加 provider/model/effort 的可选字符串契约、配对说明与更新后的工具描述断言
- [ ] T004 [P] [US1] 在 `tests/session-ops.test.ts` 增加完整选择、省略 effort、空白参数、不完整组合、校验失败、创建后选择失败及执行顺序测试
- [ ] T005 [P] [US1] 在 `tests/plugin.test.ts` 增加从 `ctx.llm` 到 session_create 的接线测试，并验证无模型参数时不需要 llm

### Implementation for User Story 1

- [ ] T006 [US1] 在 `src/session-ops.ts` 实现三个可选参数、去除首尾空白、provider/model 配对及 effort 依赖校验、创建前 `resolveCallConfig`、创建后 `agent.model.select` 与包含会话 id 的错误
- [ ] T007 [US1] 在 `src/index.ts` 将会话控制作用域中的可选 `llm` 服务传给 session_create，保持现有工具注册条件不变
- [ ] T008 [US1] 运行 `tests/contract.test.ts`、`tests/session-ops.test.ts` 与 `tests/plugin.test.ts`，确认全部通过后提交本阶段

**Checkpoint**: User Story 1 可独立交付；模型选择只写入新会话，不修改全局默认

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 同步用户文档、风险说明与完整质量门禁

- [ ] T009 [P] 更新 `README.md`，说明新增会话可选择 provider/model/effort 及配对规则
- [ ] T010 [P] 更新 `docs/how-it-works.md` 的工具参数、可选服务与会话操作顺序，记录不修改全局默认
- [ ] T011 [P] 更新 `docs/known-risks.md`，记录创建前校验与创建后选择失败的会话 id 边界
- [ ] T012 [P] 更新 `CHANGELOG.md` 的 Unreleased Added 条目
- [ ] T013 按 `specs/022-configure-session-model/quickstart.md` 运行格式、源码测试、构建与产物测试
- [ ] T014 按 `specs/022-configure-session-model/quickstart.md` 在真实 DSH 验证有效选择、默认兼容、无效 effort 与全局默认不变
- [ ] T015 审查 `src/`、`tests/`、`README.md`、`docs/` 与 `CHANGELOG.md` 的最终差异，提交本阶段

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖。
- **Foundational (Phase 2)**: 依赖 Phase 1，阻塞功能实现。
- **User Story 1 (Phase 3)**: 依赖 Phase 2；T003、T004、T005 先失败，再执行 T006 与 T007。
- **Polish (Phase 4)**: 依赖 Phase 3；T009 至 T012 可并行，随后执行验证与最终审查。

### User Story Dependencies

- **User Story 1 (P1)**: 无其他用户故事依赖，覆盖全部 MVP 范围。

### Parallel Opportunities

- T003、T004、T005 分属不同测试文件，可并行。
- T006 与 T007 分属不同源码文件，可在测试完成后并行。
- T009、T010、T011、T012 分属不同文档，可并行。

---

## Parallel Example: User Story 1

```text
先并行编写：
- tests/contract.test.ts 的公开契约测试
- tests/session-ops.test.ts 的行为与错误测试
- tests/plugin.test.ts 的服务接线测试

确认失败后，再实现：
- src/session-ops.ts 的模型配置流程
- src/index.ts 的 llm 服务接线
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 提交规格与最小类型契约。
2. 编写并确认新测试失败。
3. 完成模型校验、会话选择与入口接线。
4. 运行聚焦测试，形成可独立交付的 MVP。

### Incremental Delivery

1. Phase 1 至 Phase 3 交付完整功能。
2. Phase 4 同步文档、风险与完整验证。
3. 每个阶段提交一次，最终审查全部差异。

---

## Notes

- provider 与 model 必须成对提供，effort 必须与完整路由同用。
- 省略 effort 时保持宿主 `reasoningEffort` 字段缺省。
- 不使用会保存全局默认的 `sessionController.selectModel`。
- 创建前校验失败不创建会话；创建后选择失败必须返回会话 id。
