# Data Model: 配置新增会话的模型

## ModelSelectionInput

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| provider | string | 条件必填 | 去除首尾空白；与 model 成对出现 |
| model | string | 条件必填 | 去除首尾空白；与 provider 成对出现 |
| effort | string | 否 | 去除首尾空白；只与完整 provider/model 同用 |

- 三项均为空或省略时，使用插件默认模型；插件默认也为空时不执行模型校验或选择。
- 显式参数覆盖插件默认值，不进行字段合并。
- effort 映射到宿主 `reasoningEffort`。

## PluginModelConfig

| 配置键 | 类型 | 默认值 | 规则 |
| --- | --- | --- | --- |
| session_provider | string | `''` | 与 session_model 成对配置 |
| session_model | string | `''` | 与 session_provider 成对配置 |
| session_effort | string | `''` | 空值使用模型默认 effort；非空要求完整路由 |

配置页把三个字段纳入同一草稿，保存时一次写入，放弃时恢复。模型行选择清空 effort，显式 effort 选择写入对应等级。

## ModelDirectoryState

选择器读取官方 `ModelDirectoryState`：

- `current` 来自插件表单草稿。
- `groups`、`failures`、`status`、`error` 来自官方模型目录。
- `pending` 只表示一次本地草稿选择尚未完成。
- `routable` 表示当前 provider/model 是否在目录中。

选择器的选择动作只调用表单 `edit`，不调用 `session.selectModel`，也不直接保存。

## SessionCreateResult

现有返回字段保持不变：`sessionId`、可选 `agentPreset`、可选 `title`、`prompted`。

## 执行状态

1. **未配置**：沿用宿主默认模型。
2. **已解析**：使用显式工具参数或插件默认模型。
3. **已校验**：完整模型配置通过精确路由与 effort 校验。
4. **已创建**：宿主返回新会话 id。
5. **已选择**：新会话记录完整 provider/model 与可选 effort。
6. **已完成**：按请求设置标题并投递首条消息。

创建后的模型解析或选择失败时，流程停止并返回包含 sessionId 的错误。标题与首条消息不执行。宿主全局默认模型在整个流程中不变。
