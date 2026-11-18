# Tasks: 会话消息投递修复

**Input**: Design documents from `specs/019-session-delivery/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格明确要求覆盖三条投递链路。每个用户故事先写回归测试并确认失败，再实现修复。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 文件不同且没有未完成依赖，可并行执行。
- **[Story]**: US1 对应向已有会话投递消息，US2 对应创建会话并投递首条消息。

## Phase 1: Setup

**Purpose**: 建立可运行的基线并确认现有测试未覆盖宿主信号参数。

- [X] T001 根据 `pnpm-lock.yaml` 安装锁定依赖，运行 `tests/session-ops.test.ts` 基线测试并记录现有投递测试通过

---

## Phase 2: Foundational

**Purpose**: 让内部服务类型能够表达宿主的真实信号参数，保持现有调用可编译。

- [X] T002 在 `src/types.ts` 的 `SessionControllerLike.prompt` 增加第二个可选 `signal: AbortSignal` 参数，作为两条故事修复前的兼容类型

**Checkpoint**: 内部类型可传递执行信号，公开工具契约不变。

---

## Phase 3: User Story 1 - 向已有会话投递消息 (Priority: P1) 🎯 MVP

**Goal**: 恢复已有会话的 queue 与 steer 投递，并传播调用方取消信号。

**Independent Test**: 用会执行 `signal.throwIfAborted()` 的宿主替身分别运行 queue 与 steer；旧实现因信号缺失失败，修复后两条用例成功且第二参数等于当前执行信号。

### Tests for User Story 1

- [X] T003 [US1] 在 `tests/session-ops.test.ts` 为 queue 与 steer 增加严格信号回归，替身拒绝对 `undefined` 调用 `throwIfAborted`，先运行并确认两条用例失败

### Implementation for User Story 1

- [X] T004 [US1] 在 `src/session-ops.ts` 的 `buildSessionSendTool` 中把 `exec.signal` 作为第二个参数传给 `sessionController.prompt`，运行 `tests/session-ops.test.ts` 的 session_send 用例并确认通过

**Checkpoint**: queue 与 steer 可独立验收，system-reminder 包装与 subagent 路由保持不变。

---

## Phase 4: User Story 2 - 创建会话并投递首条消息 (Priority: P1)

**Goal**: 创建带 prompt 的会话时成功投递首条消息，同时保持空白会话创建行为。

**Independent Test**: 用严格宿主替身创建带首条消息的会话；旧实现失败，修复后返回 `prompted: true` 且第二参数等于当前执行信号；不带 prompt 的用例继续通过。

### Tests for User Story 2

- [X] T005 [US2] 在 `tests/session-ops.test.ts` 增加首条消息的严格信号回归与空白会话回归，先运行并确认首条消息用例失败

### Implementation for User Story 2

- [X] T006 [US2] 在 `src/session-ops.ts` 的 `buildSessionCreateTool` 中把 `exec.signal` 作为第二个参数传给 `sessionController.prompt`，并在 `src/types.ts` 把该参数改为必需，运行 session_create 用例并确认通过

**Checkpoint**: 两条 P1 故事均通过独立测试，内部类型与宿主签名一致。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 验证插件接线、文档、构建产物与真实宿主行为。

- [ ] T007 [P] 在 `tests/plugin.test.ts` 使用 `tests/helpers.ts` 的 `makeCtx` 增加从插件注册到工具执行的投递回归，验证实际注册工具也传递执行信号
- [ ] T008 [P] 更新 `docs/how-it-works.md` 的会话投递信号说明，并按分支交付规则更新 `CHANGELOG.md`
- [ ] T009 运行 `pnpm format && pnpm check`，随后运行 `pnpm full-check`，确认 `tests/package-pack.test.ts` 与全部构建产物测试通过
- [ ] T010 按 `specs/019-session-delivery/quickstart.md` 在真实 DSH 宿主验收空白创建、带 prompt 创建、queue、steer、运行中停止和停止后再次投递

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: 无依赖。
- **Foundational**: 依赖 Setup。
- **US1**: 依赖 Foundational；完成后形成 MVP。
- **US2**: 依赖 Foundational；与 US1 共用类型，按 T002 → T004 → T006 顺序收敛为必需信号。
- **Polish**: 依赖 US1 与 US2。

### User Story Dependencies

- **US1**: 可独立修复并验证 session_send。
- **US2**: 可独立修复并验证 session_create；最终类型必需化依赖 US1 已传信号。

### Parallel Opportunities

- T007 与 T008 使用不同文件，可并行。
- 两条故事共用 `src/session-ops.ts`、`src/types.ts` 与 `tests/session-ops.test.ts`，按顺序执行。

## Parallel Example: Polish

```text
Task: "T007 在 tests/plugin.test.ts 增加插件接线回归"
Task: "T008 更新 docs/how-it-works.md 与 CHANGELOG.md"
```

## Implementation Strategy

1. 完成基线与兼容类型。
2. 先以严格宿主替身复现并修复 queue/steer，形成 MVP。
3. 再以相同方式复现并修复首条消息，收敛必需信号类型。
4. 完成插件接线、文档、完整质量门禁与真实宿主验收。
5. 每个阶段完成后提交一个 commit。
