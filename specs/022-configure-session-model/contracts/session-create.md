# Contract: session_create

## 新增参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| provider | string | 否 | provider id；与 model 同时提供 |
| model | string | 否 | model id；与 provider 同时提供 |
| effort | string | 否 | 精确路由支持的 reasoning effort id；要求同时提供 provider 与 model，省略时使用模型默认值 |

三个参数都接受首尾空白。空白字符串按未提供处理。

## 行为

- 三项全部省略时，现有请求与默认行为不变。
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

## 兼容性

现有参数、返回字段与省略模型参数时的行为保持不变。本变更只新增可选参数。
