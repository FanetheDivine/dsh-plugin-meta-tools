# Research: 工具描述标明 DSH 归属

## 归属词的写法

- Decision: 每条描述同时写出 "DSH" 与 "DeepSeek Harness"，使用 "DSH (DeepSeek Harness) workspace/session"。
- Rationale: 工具描述可能被单独呈现、检索或截断，单条自包含才能稳定建立全称与缩写的对应。用户用任一种写法提出请求时都能命中。
- Alternatives considered: 只在 `workspace_list` 与 `session_list` 写全称。依赖十一个描述同时进入上下文，局部上下文或单条检索时映射丢失。

## 改动范围

- Decision: 只改十一个工具的顶层描述，参数描述、工具名、输出与错误保持不变。
- Rationale: 工具选择依据顶层描述；参数描述在调用阶段已足够明确，改动它会扩大契约变更面。
- Alternatives considered: 同时给 `session_id`、`workspace_id` 等参数描述加 DSH。收益低于维护成本，并会让参数文案与错误提示不一致。

## 契约测试

- Decision: 在 `tests/contract.test.ts` 同步完整描述文本，并新增断言：每条描述包含 "DSH"、"DeepSeek Harness"，且按工具类型包含 "DSH (DeepSeek Harness) workspace" 或 "DSH (DeepSeek Harness) session"。
- Rationale: 现有测试以完整字符串锁定契约，新增断言让未来工具在缺少 DSH 词时立即失败。
- Alternatives considered: 只用正则校验词串，不保存完整文本。会失去对描述语义与文案质量的回归保护。

## 用户文档

- Decision: 不改 README、配置页与插件元数据。
- Rationale: 工具能力、开关与界面不变，变化只影响模型看到的描述。
- Alternatives considered: 在 README 增加说明。用户可见能力没有变化，增加说明会重复工具契约文档的信息。
