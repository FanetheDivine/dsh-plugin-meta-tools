# dsh-plugin-meta-tools

DSH 插件：为模型提供操作工作区与会话的元工具。十一个工具可在“插件”面板逐项开关，保存后立即生效。

## 功能

- 工作区：列出、注册、重命名与移除注册。
- 会话读取：按标题查询会话列表；把主会话与 subagent 的日志导出到临时目录。
- 会话操作：新建、停止、发送 system-reminder、置顶、归档。
- 服务可选：缺少工作区注册表、会话查询或会话控制服务时，只跳过对应工具，插件照常加载。
- 数据安全：注册与移除工作区只改注册表，不复制、移动或删除目录与会话日志。
- 插件页标题与描述随宿主语言切换，中英文各一份。

## 安装

```sh
dsh plugin add dsh-plugin-meta-tools
```

也可以安装本地目录：`dsh plugin add <插件目录>`。

本插件与 `@local/dsh-harness-tools` 提供同名工具。同一部署只保留其中一个，安装前先移除另一个的插件行。

## 配置

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `workspace_list` | `true` | 是否注册 `workspace_list` |
| `workspace_create` | `true` | 是否注册 `workspace_create` |
| `workspace_remove` | `true` | 是否注册 `workspace_remove` |
| `workspace_rename` | `true` | 是否注册 `workspace_rename` |
| `session_list` | `true` | 是否注册 `session_list` |
| `session_get` | `true` | 是否注册 `session_get` |
| `session_create` | `true` | 是否注册 `session_create` |
| `session_stop` | `true` | 是否注册 `session_stop` |
| `session_send` | `true` | 是否注册 `session_send` |
| `session_pin` | `true` | 是否注册 `session_pin` |
| `session_archive` | `true` | 是否注册 `session_archive` |

十一个字段都是 `volatile`：在“插件”页的行详情里修改并保存，插件不重启，工具按新开关注册或注销。配置中的键缺省或为 `null` 时按 `true` 处理；未知键或非布尔值使插件加载失败。

## 工具

| 工具 | 参数 | 返回 |
| --- | --- | --- |
| `workspace_list` | 无 | 工作区数量与逐项 id、标题、路径、状态、会话计数 |
| `workspace_create` | `path`、`title?` | `created`、工作区视图与可选说明 |
| `workspace_remove` | `workspace_id` | `removed`、被移除的 id 与路径 |
| `workspace_rename` | `workspace_id`、`title` | 更新后的工作区视图 |
| `session_list` | `workspace_id?`、`cwd?`、`query?`、`limit?`、`titles?`、`include_archived?` | 会话总数、本页摘要与可选说明 |
| `session_get` | `session_id` | 临时目录、主会话文件、全部文件与 subagent 数 |
| `session_create` | `workspace_id?`、`cwd?`、`agent_preset?`、`title?`、`prompt?` | 新会话 id、预设、标题与是否已投递首条消息 |
| `session_stop` | `session_id` | `accepted` 与会话 id |
| `session_send` | `session_id`、`text`、`mode?` | `delivered`、会话 id 与投递模式 |
| `session_pin` | `session_id`、`remove?` | `pinned` 与会话 id |
| `session_archive` | `session_id`、`remove?`、`stop_activity?` | `archived` 与会话 id |

`session_list` 的 `query` 对折叠标题做大小写不敏感的子串匹配。列表省略调用方会话；subagent 会话归并到主会话。标题查询最多折叠 200 个会话的标题，超过时结果附说明。

## 会话日志

`session_get` 把日志写成规范 JSONL：

```text
<系统临时目录>/dsh-plugin-meta-tools/session-logs/<session-id>-<时间戳>-<随机后缀>/
├── session.jsonl 或 session.vN.jsonl
└── subagents/<session-id>/session[.vN].jsonl
```

- 首行是会话头，其后每行一个事件。
- 文件名与内容对齐宿主 `/export` 的日志产物。
- 每次调用使用独立目录，历史目录由操作系统清理。
- 不导出图片与附件。

## 限制

- 只操作加载本插件的 DSH，不支持跨安装。
- 不提供会话删除与恢复已删除会话；归档可以通过 `remove` 恢复。
- `workspace_remove` 只移除注册；目录与全部会话日志保留。
- `session_get` 的临时目录不自动清理，长期运行需要自行清理。
- 归档运行中的会话需要 `stop_activity: true`；否则返回错误并提示先停止。
- 置顶要求会话存在且未归档；归档会移除置顶。
- 发送消息默认排队，`mode: "steer"` 在最近一步投递；subagent 目标按队列投递。
- 停止与发送在目标是 subagent 会话时走子代理路由，调用方必须是它的祖先。

## 开发

构建、测试与实机验证见 [docs/development.md](./docs/development.md)。