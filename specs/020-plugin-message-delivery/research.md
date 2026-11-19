# Phase 0 Research: 插件消息投递约束

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-19

## 宿主契约

当前宿主与项目依赖均为 DSH `0.2.2-rc.3`。

- `@deepseek-ai/dsh-agent` 的 README 在 Drive an agent's conversation 中给出 `agent.steer({ content, source: { kind: 'my-plugin' } })` 示例。
- 同包 `src/runtime-types.ts` 定义 `steer(message)`：空闲 Agent 开始新轮次，运行中 Agent 在最近步骤边界接收消息。
- `@deepseek-ai/dsh-api-session-controller` 的 `src/index.ts` 暴露 `resolveAgent(sessionId)`，用于解析或恢复普通会话的 Agent。
- 同包 `src/agent.ts` 定义返回联合 `{ agent } | { error }`，subagent 归属通过 `session/agent-busy` 错误返回。
- `@deepseek-ai/dsh-subagent` 的 `src/index.ts` 说明 `sendMessage` 是插话；`src/continuation-messages.ts` 将其来源固定为 `agent-message`，公开选项只有取消信号。

## 决策

### D1 使用 Agent.steer 投递

- **Decision**: `session_send` 调用 `sessionController.resolveAgent(session_id)`，成功时调用 `agent.steer({ content, source: { kind: PLUGIN_LABEL } })`。
- **Rationale**: 这是宿主公开的插件插话接口，来源类型直接使用当前插件名。
- **Alternatives considered**: `sessionController.prompt` 会建立用户 RPC 来源；`followup` 是下一轮消息；`inject` 不会唤醒空闲 Agent。

### D2 统一首条消息投递

- **Decision**: `session_create` 的可选首条消息也使用同一 `resolveAgent`、插件来源和 `steer` 链路，公开输入与 `prompted` 结果保持不变。
- **Rationale**: 用户要求投递不使用会话 `prompt`，且每条成功投递都以插件名作为来源。
- **Alternatives considered**: 保留会话 `prompt` 会继续产生用户 RPC 来源，并留下两条来源不同的投递路径。

### D3 删除投递模式

- **Decision**: 删除 `mode` 输入、`SessionSendView.mode`、结果中的 `mode` 和渲染后缀，工具说明只描述插话。
- **Rationale**: 固定 `steer` 后模式选择与模式返回均不再提供信息。
- **Alternatives considered**: 保留常量 `steer` 会留下无效选项和冗余结果。

### D4 移除 subagent 投递回退

- **Decision**: `session_send` 不再调用 `subagents.sendMessage`；`resolveAgent` 返回的归属错误沿用现有错误前缀抛出。
- **Rationale**: 该回退以来源 `agent-message` 记录消息，无法满足所有成功投递均使用插件名的约束。
- **Alternatives considered**: 保留回退会产生非插件来源；访问宿主私有 manager 或绕过 subagent 所有权会破坏宿主契约。

### D5 保留取消语义

- **Decision**: 在解析目标前后调用当前 `exec.signal.throwIfAborted()`，通过检查后再同步执行 `steer`。
- **Rationale**: `resolveAgent` 没有取消参数，前后检查可避免已取消调用在恢复目标后继续投递。
- **Alternatives considered**: 传递信号给 `steer` 不符合签名；删除取消检查会改变现有调用行为。

### D6 消息构造、测试与依赖

- **Decision**: 使用 `@deepseek-ai/dsh-llm` 的 `createUserMessage` 补充消息 id 和 user 角色，并在类型层面登记 `dsh-plugin-meta-tools` 来源；新增该包的同版本开发依赖及 `minimumReleaseAgeExclude` 条目。测试替身提供 `resolveAgent` 和记录 `steer` 的 Agent，断言来源、内容、调用次数、返回结构和取消行为。
- **Rationale**: 宿主工厂生成完整且冻结的消息；显式依赖符合包归属规则；测试直接验证宿主公开契约及可观察结果。
- **Alternatives considered**: 手工拼装消息会重复宿主身份生成与冻结逻辑；依赖传递包不提供可靠的直接导入契约；只断言工具返回成功无法发现错误来源或错误路由。

## 未决项

无。
