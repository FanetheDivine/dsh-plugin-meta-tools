# Data Model: 会话消息投递修复

本修复不新增持久化实体或存储结构，只修正现有请求与执行上下文之间的连接。

| 概念 | 字段 | 规则 |
| --- | --- | --- |
| 会话投递请求 | `requestId`、`sessionId`、`mode`、`content` | 沿用现有结构；`mode` 为 `queue` 或 `steer`；正文含非空文本 |
| 工具执行上下文 | `signal` | 当前调用的 `AbortSignal`，作为独立参数传给宿主投递方法 |
| 会话创建结果 | `sessionId`、`agentPreset?`、`title?`、`prompted` | 仅首条消息被宿主接受后 `prompted` 为 `true` |
| 会话发送结果 | `delivered`、`sessionId`、`mode` | 仅消息被宿主接受后 `delivered` 为 `true` |
| 会话停止结果 | `accepted`、`sessionId` | 表示已请求取消当前轮次 |

## 状态规则

1. 新建会话后可处于空闲状态；提供首条消息时进入已接受投递状态。
2. queue 消息进入后续轮次处理流程，steer 消息进入最近步骤的引导流程。
3. 宿主拒绝或取消投递时返回失败，不生成成功结果。
4. 停止仅取消当前轮次，保留待处理消息。
