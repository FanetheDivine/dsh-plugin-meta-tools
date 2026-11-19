# Data Model: 工具描述标明 DSH 归属

本次不改变运行时数据。数据对象是工具定义中的顶层描述。

## 工具描述

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `tool` | 工具名 | 十一个既有工具名，保持不变 |
| `object` | 对象类型 | 工作区工具为 `workspace`，会话工具为 `session` |
| `description` | 英文字符串 | 以 `defineTool` 的 `description` 注册；完整文本见 [contracts/tool-descriptions.md](./contracts/tool-descriptions.md) |

## 词串约束

| 工具 | 对象 | 必须出现的词串 |
| --- | --- | --- |
| `workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename` | workspace | `DSH`、`DeepSeek Harness`、`DSH (DeepSeek Harness) workspace` |
| `session_list`、`session_get`、`session_create`、`session_stop`、`session_send`、`session_pin`、`session_archive` | session | `DSH`、`DeepSeek Harness`、`DSH (DeepSeek Harness) session` |

规则：

- 每个工具只对应一种对象类型。
- 词串区分大小写。
- 描述保持英文，只描述能力与归属，不引入新能力。
