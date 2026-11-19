# Contract: session_create

## 新增参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| provider | string | 否 | provider id；与 model 同时提供 |
| model | string | 否 | model id；与 provider 同时提供 |
| effort | string | 否 | 精确路由支持的 reasoning effort id；要求同时提供 provider 与 model，省略时使用模型默认值 |

三个参数都接受首尾空白。空白字符串按未提供处理。

## 行为

- 三项全部省略时使用插件默认模型；插件默认也为空时沿用宿主默认。
- 显式工具参数覆盖插件默认值，不合并字段。
- 提供模型配置时，先校验精确 provider/model/effort，再创建会话。
- 创建后把选择写入该会话，再处理 title 与 prompt。
- 选择只作用于新会话，不保存为全局默认。
- 宿主选择字段为 `reasoningEffort`，由 effort 映射得到。

## 错误

| 情况 | 结果 |
| --- | --- |
| provider 与 model 未成对出现 | 创建前返回参数错误 |
| effort 未搭配完整 provider/model | 创建前返回参数错误 |
| 模型校验服务不可用 | 创建前返回错误 |
| provider、model 或 effort 校验失败 | 创建前返回包含底层原因的错误 |
| 创建后的 Agent 解析或模型选择失败 | 返回包含新会话 id 的错误，不处理 title 与 prompt |

## 插件默认模型配置

| 配置键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| session_provider | string | `''` | 默认 provider，与 session_model 成对 |
| session_model | string | `''` | 默认 model，与 session_provider 成对 |
| session_effort | string | `''` | 默认 effort，空值使用模型默认值 |

配置页复用官方模型与推理等级选择器。模型名前显示 provider，额外 options 槽为空，不显示团队协作配置项。选择只修改草稿，保存后生效并热更新后续新建会话。

## 兼容性

现有参数、返回字段与未保存插件默认值时的行为保持不变。本变更新增可选参数与可选配置字段。
