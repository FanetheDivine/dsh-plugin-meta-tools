# Data Model: 配置新增会话的模型

## ModelSelectionInput

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| provider | string | 条件必填 | 去除首尾空白；与 model 成对出现 |
| model | string | 条件必填 | 去除首尾空白；与 provider 成对出现 |
| effort | string | 否 | 去除首尾空白；只与完整 provider/model 同用 |

- 三项均为空或省略时，不执行模型校验或选择。
- provider 与 model 非空时形成完整路由。
- effort 映射到宿主 `reasoningEffort`，省略时保持字段缺省。
- 不完整的组合在创建会话前返回参数错误。

## SessionCreateResult

现有返回字段保持不变：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| sessionId | string | 新会话 id |
| agentPreset | string | 可选预设 id |
| title | string | 可选标题 |
| prompted | boolean | 首条消息是否已投递 |

## 执行状态

1. **未配置**：沿用现有创建流程。
2. **已校验**：完整模型配置通过精确路由与 effort 校验，尚未创建会话。
3. **已创建**：宿主返回新会话 id。
4. **已选择**：新会话记录完整 provider/model 与可选 effort。
5. **已完成**：按请求设置标题并投递首条消息。

创建后的模型解析或选择失败时，流程停止并返回包含 sessionId 的错误。标题与首条消息不执行。全局默认模型在整个流程中不变。
