# Research: 配置新增会话的模型

## 宿主创建契约

- Decision: 保留 `sessionController.create` 的现有请求字段，模型选择在创建后执行。
- Rationale: 宿主 0.2.2-rc.3 的 `SessionCreateRequest` 只包含会话位置、身份与预设。`SessionCommandController.create` 不读取模型字段，见 `packages/api/session-controller/src/commands.ts`。
- Alternatives considered: 直接向 `create` 增加 provider、model、reasoningEffort。宿主会忽略这些字段，无法形成真实行为。

## 会话级选择

- Decision: 通过 `sessionController.resolveAgent` 取得新会话 Agent，再调用 `agent.model.select`。
- Rationale: 该接口把完整选择写入新会话的 `model/selection` 事件，并应用于下一轮准备，见 `packages/core/agent/src/model-selection.ts` 与 `packages/core/agent/src/runtime-types.ts`。
- Alternatives considered: 调用 `sessionController.selectModel`。该接口还会通过 `agentDefaultModel.saveSelection` 保存全局默认，超出本需求范围，见 `packages/api/session-controller/src/commands.ts`。

## 参数与默认值

- Decision: 工具新增 `provider`、`model`、`effort` 三个字符串参数。provider 与 model 必须成对提供，effort 必须与二者同用。
- Rationale: 宿主的 `ModelSelection` 要求完整 provider/model 路由，effort 是对应路由的可选控制。公开参数沿用需求中的 effort，宿主字段映射为 reasoningEffort。
- Alternatives considered: 允许只给 model 或 effort 并继承当前路由。该行为需要额外默认合并规则，且与宿主完整选择契约不一致。

## 校验与执行顺序

- Decision: 创建前调用 `llm.resolveCallConfig` 校验选择；创建后选择模型；随后设置标题并投递首条消息。
- Rationale: `resolveCallConfig` 校验精确模型和 reasoning effort，并在不支持的 effort 上抛错，见 `packages/core/llm/src/index.ts`。提前校验避免无效配置留下空白会话。创建后的解析或选择失败仍需返回新会话 id。
- Alternatives considered: 首条消息执行时由模型请求自然失败。该行为会留下已创建会话并已设置标题，错误也更晚出现。

## effort 省略规则

- Decision: 省略 effort 时省略宿主 reasoningEffort 字段，不使用校验结果中的默认值填充选择。
- Rationale: `agent.model.select` 将省略 effort 定义为使用适配器默认值。校验结果可能物化默认值，直接写入会把默认值固定为显式选择。
- Alternatives considered: 把校验后的完整配置写入会话。该做法改变了宿主对省略 effort 的语义。

## 服务接入

- Decision: 从现有会话控制工具组的作用域读取可选 `llm` 服务，只在使用模型参数时要求它可用。
- Rationale: `@deepseek-ai/dsh-llm` 已是同版本宿主依赖。缺少 llm 不影响现有新建、停止与发送能力。
- Alternatives considered: 把 llm 加为整个插件的必需注入服务。该做法会改变插件加载条件。
