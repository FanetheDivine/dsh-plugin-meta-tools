---
description: "Task list for plugin message delivery constraints"
---

# Tasks: 插件消息投递约束

**Input**: Design documents from `specs/020-plugin-message-delivery/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/session-send.md、quickstart.md

**Tests**: 每个故事先更新行为测试并确认旧实现失败，再实施代码。

**Organization**: 按用户故事组织，每个阶段对应一个 commit。

## Phase 1: Setup

**Purpose**: 补齐宿主消息工厂的直接依赖。

- [X] T001 在 `package.json` 增加 `@deepseek-ai/dsh-llm@0.2.2-rc.3`，在 `pnpm-workspace.yaml` 增加对应 `minimumReleaseAgeExclude`，更新 `pnpm-lock.yaml` 并安装依赖

---

## Phase 2: Foundational

**Purpose**: 建立两条投递链路共用的宿主类型。

**⚠️ CRITICAL**: 类型完成后再修改工具行为。

- [X] T002 在 `src/types.ts` 增加 `resolveAgent` 返回联合与 `dsh-plugin-meta-tools` 消息来源声明

**Checkpoint**: `SessionControllerLike` 能解析普通 Agent，消息来源接受当前插件名。

---

## Phase 3: User Story 1 - 以插件身份插话 (Priority: P1) 🎯 MVP

**Goal**: 两条插件投递链路都通过普通 Agent 固定插话，来源类型等于插件名。

**Independent Test**: 新建带首条消息的会话并向已有会话投递，检查 `steer` 收到完整 user-role 消息、`source.kind` 为 `dsh-plugin-meta-tools`，且 subagent 回退不再执行。

### Tests for User Story 1

- [X] T003 [P] [US1] 更新 `tests/session-ops.test.ts`，覆盖两处 `resolveAgent + steer`、完整消息来源、正文转义、解析错误、取消前后检查及 subagent 归属拒绝，并确认旧实现失败
- [X] T004 [P] [US1] 更新 `tests/plugin.test.ts`，通过 `tests/helpers.ts` 的模拟 `ctx` 验证注册后的 `session_send` 以插件来源插话，并确认旧实现失败

### Implementation for User Story 1

- [X] T005 [US1] 在 `src/session-ops.ts` 用 `createUserMessage` 和共享插话函数替换两处 `sessionController.prompt`，设置 `source.kind` 为 `PLUGIN_LABEL`，保留各自错误前缀并移除 `subagents.sendMessage` 回退；在 `src/types.ts` 删除旧投递类型

**Checkpoint**: 两条链路只产生插件来源的插话，空文本与创建错误行为保持有效。

---

## Phase 4: User Story 2 - 使用单一的投递方式 (Priority: P2)

**Goal**: 调用方只需提供目标和内容，结果不再暴露投递模式。

**Independent Test**: 编译后的 `session_send` 只有 `session_id`、`text` 两个属性，成功结果为 `delivered`、`sessionId`，工具说明与渲染不包含 queue/steer 选项。

### Tests for User Story 2

- [ ] T006 [P] [US2] 更新 `tests/contract.test.ts` 与 `tests/session-ops.test.ts`，断言 `mode` 输入和返回不存在、说明只描述插话，并确认旧实现失败

### Implementation for User Story 2

- [ ] T007 [US2] 在 `src/session-ops.ts` 删除 `mode` 参数、`args.mode` 分支、`SessionSendView.mode`、返回字段与渲染后缀

**Checkpoint**: 固定插话成为唯一公开投递方式。

---

## Phase 5: Polish & Cross-cutting Concerns

**Purpose**: 同步用户文档、机制说明和发布验证。

- [ ] T008 [P] 更新 `README.md` 的 `session_send` 参数与返回、两处插件来源插话说明及 subagent 目标限制
- [ ] T009 [P] 更新 `docs/how-it-works.md` 的会话操作机制，记录 `createUserMessage`、`resolveAgent`、`steer`、来源和取消检查
- [ ] T010 运行 `pnpm format && pnpm check`，修复 `src/`、`tests/`、`README.md` 与 `docs/how-it-works.md` 的格式、类型、lint 或测试问题
- [ ] T011 运行 `pnpm full-check` 并按 `specs/020-plugin-message-delivery/quickstart.md` 验证真实 DSH 宿主的消息来源与插话行为
- [ ] T012 审查 `src/`、`tests/`、`package.json`、`pnpm-workspace.yaml` 与文档最终差异，确认无 `sessionController.prompt` 投递和 `session_send.mode` 残留

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: 消息工厂依赖与类型先行。
- **Phase 2 → Phase 3**: 两条故事共用 `resolveAgent` 和来源类型。
- **Phase 3 → Phase 4**: 先保证实际插话与来源，再删除公开模式字段。
- **Phase 4 → Phase 5**: 行为稳定后更新文档并执行完整验证。
- **US1**: 无其他故事依赖，可独立交付插件来源插话。
- **US2**: 依赖 US1 的固定插话实现，参数与结果精简可独立验收。

## Parallel Examples

```text
Phase 3: T003 tests/session-ops.test.ts 与 T004 tests/plugin.test.ts 可并行。
Phase 5: T008 README.md 与 T009 docs/how-it-works.md 可并行。
```

## Implementation Strategy

1. 完成 Setup 与 Foundational，准备同版本宿主依赖和类型。
2. 完成 US1，验证两条链路的插件来源插话，形成 MVP。
3. 完成 US2，删除模式输入与返回，验证公开契约。
4. 完成文档、质量门禁、真实宿主验证与最终差异审查。

## Notes

- 每个阶段完成后提交一个 commit。
- 测试必须验证真实宿主调用参数与可观察行为。
- 全程保持主工作区不变。
