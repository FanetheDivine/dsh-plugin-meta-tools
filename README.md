# dsh-plugin-meta-tools

DSH 插件：为模型提供操作本 profile 工作区与会话的工具。六个工具可在“插件”面板逐项开关，保存后立即生效。

## 功能

- 工作区：列出、注册、重命名与移除注册。
- 会话：列出会话，按 id 读取元数据与最新可见消息。
- 配置：插件面板提供六个开关，键名与工具名一致，默认全部开启。
- 数据安全：注册与移除工作区只改注册表，不复制、移动或删除目录与会话日志。

## 安装

```sh
dsh plugin add dsh-plugin-meta-tools
```

也可以安装本地目录：`dsh plugin add <插件目录>`。

本插件与 `@local/dsh-harness-tools` 提供同名工具。同一 profile 只保留其中一个，安装前先移除另一个的插件行。

## 配置

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `workspace_list` | `true` | 是否注册 `workspace_list` |
| `workspace_create` | `true` | 是否注册 `workspace_create` |
| `workspace_remove` | `true` | 是否注册 `workspace_remove` |
| `workspace_rename` | `true` | 是否注册 `workspace_rename` |
| `session_list` | `true` | 是否注册 `session_list` |
| `session_get` | `true` | 是否注册 `session_get` |

六个字段都是 `volatile`：在“插件”页的行详情里修改并保存，插件不重启，工具按新开关注册或注销。配置中的键缺省或为 `null` 时按 `true` 处理；未知键或非布尔值使插件加载失败。

## 工具

| 工具 | 参数 | 返回 |
| --- | --- | --- |
| `workspace_list` | 无 | 工作区数量与逐项 id、标题、路径、状态、会话计数 |
| `workspace_create` | `path`、`title?` | `created`、工作区视图与可选说明 |
| `workspace_remove` | `workspace_id` | `removed`、被移除的 id 与路径 |
| `workspace_rename` | `workspace_id`、`title` | 更新后的工作区视图 |
| `session_list` | `workspace_id?`、`cwd?`、`limit?`、`titles?`、`include_archived?` | 会话总数、本页摘要与可选说明 |
| `session_get` | `session_id`、`messages?` | 会话元数据与最新可见消息 |

工具说明、参数与返回值与 `@local/dsh-harness-tools` 1.0.0 一致。

## 限制

- 只操作加载本插件的 profile，不支持跨 profile。
- 不提供会话创建、归档、删除或恢复。
- `workspace_remove` 只移除注册；目录与全部会话日志保留。
- `session_list` 读取标题会访问所列出会话的日志；页长超过 40 或传 `titles: false` 时跳过。
- `session_get` 单条消息最多 2000 字符，全部消息预算 12000 字符。

## 开发

构建、测试与实机验证见 [docs/development.md](./docs/development.md)。
