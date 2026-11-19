# Data Model: 插件消息投递约束

**Feature**: [spec.md](./spec.md)

## 投递输入

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `session_id` | string | 必填，目标普通会话 id |
| `text` | string | 必填，去除首尾空白后不能为空 |

`mode` 不属于输入。正文继续包装为一个 system-reminder 文本块，正文中的闭合标签继续转义。

## 宿主消息

| 字段 | 值 |
| --- | --- |
| `id` | 宿主消息工厂生成的稳定字符串 id |
| `role` | `user` |
| `content` | 一个包含 system-reminder 的文本块 |
| `source.kind` | `dsh-plugin-meta-tools` |

消息只进入目标的下一作业步骤边界。目标空闲时开始新轮次，目标运行时由最近步骤接收。`session_create` 的可选首条消息使用相同的消息实体和状态规则。

## 投递结果

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `delivered` | `true` | 目标 Agent 已接受插话调用 |
| `sessionId` | string | 目标会话 id |

结果不包含 `mode`。

## 错误与状态

- 空文本在解析目标前拒绝。
- 调用已取消时不解析目标或不执行插话。
- 目标解析失败时返回 `Could not deliver the reminder to session '<id>': <reason>`。
- subagent 归属错误保持宿主原因，不改用其他来源投递。
- 成功结果表示消息已进入 Agent 的插话流程，不表示模型已完成处理。
