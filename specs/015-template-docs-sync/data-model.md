# Data Model: 模板文档同步

本次无持久化数据。下表定义规则与归属文档的关系。

| 规则组 | 归属 | 验证规则 |
| --- | --- | --- |
| 宿主依赖版本 | `.specify/memory/constitution.md` 原则 I | 同版本 `@deepseek-ai/dsh` 是唯一依据；`dsh-*` 使用同一确切版本并列入 `minimumReleaseAgeExclude` |
| 测试同步 | `.specify/memory/constitution.md` 原则 II | 原原则 IV 条款完整保留 |
| 文档结构 | `.specify/memory/constitution.md` 原则 III | 原原则 V 条款完整保留 |
| 质量门禁 | `.specify/memory/constitution.md` 原则 IV | 原原则 VI 条款完整保留 |
| 公开引用 | `.specify/memory/constitution.md` 原则 V | 原原则 VIII 条款完整保留 |
| 宿主契约 | `docs/how-it-works.md` 入口契约 | 四个导出、配置 schema、必需与可选服务、type-only 导入完整保留 |
| 依赖归属 | `docs/how-it-works.md` 依赖复用 | 宿主提供与插件自备两类规则完整保留 |
| 严格配置 | `docs/how-it-works.md` 配置解析 | 默认值、严格校验与冻结规则完整保留 |
| 工具契约 | `docs/how-it-works.md` 工具契约 | 十一个工具、契约回归、同名开关、兼容性说明与用户确认规则完整保留 |
| 国际化 | `docs/i18n.md` 约束 | 原原则 IX 条款完整保留，工具契约文案链接到工具契约节 |
| 主工作区 | `AGENTS.md` 主工作区 | 分支、清洁状态、允许操作与变更位置各有一条规则 |
