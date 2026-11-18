# Data Model: 会话元工具与会话日志导出

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-18

## 配置

| 键 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `workspace_list` | boolean | true | 注册 `workspace_list` |
| `workspace_create` | boolean | true | 注册 `workspace_create` |
| `workspace_remove` | boolean | true | 注册 `workspace_remove` |
| `workspace_rename` | boolean | true | 注册 `workspace_rename` |
| `session_list` | boolean | true | 注册 `session_list` |
| `session_get` | boolean | true | 注册 `session_get` |
| `session_create` | boolean | true | 注册 `session_create` |
| `session_stop` | boolean | true | 注册 `session_stop` |
| `session_send` | boolean | true | 注册 `session_send` |
| `session_pin` | boolean | true | 注册 `session_pin` |
| `session_archive` | boolean | true | 注册 `session_archive` |

规则：

- 缺省或 `null` 取默认值。
- 未知键抛 `dsh-plugin-meta-tools: unknown config key "<key>"`。
- 非布尔值抛 `dsh-plugin-meta-tools: config <key> must be a boolean`。
- 配置对象不是对象时抛 `dsh-plugin-meta-tools: config must be an object`。

## Workspace

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定注册 id |
| `title` | string | 显示标题 |
| `path` | string | 规范化绝对路径 |
| `sessionIds` | string[] | 会话账本，按手动顺序 |
| `createdAt` | string | ISO-8601 |
| `updatedAt` | string | ISO-8601 |
| `status()` | `'ok' \| 'missing-dir'` | 实时目录检查 |

约束：标题允许重复；路径唯一以规范化路径为准；移除注册不影响目录与会话日志。

## Session record

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `header.id` | string | 会话 id |
| `header.cwd` | string? | 记录的绝对目录 |
| `header.createdAt` | number | epoch 毫秒 |
| `header.agentPreset` | string? | 预设 |
| `header.parentSession` | `{ id }`? | 父会话；subagent 有值 |
| `header.origin` | `'subagent'`? | 来源 |
| `live` | boolean | 是否在活动会话表中 |
| `persisted` | boolean | 是否由持久化后端列出 |

规则：

- 主会话：沿 `parentSession.id` 向上追溯，直到没有父或父不在列表中。
- 父链断开时，以能追溯到的最高已知会话为主会话。
- 同一主会话只占一行。

## Session summary（工具返回）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主会话 id |
| `title` | string? | 折叠标题；无标题时省略 |
| `cwd` | string? | 记录目录 |
| `createdAt` | string | ISO-8601 |
| `live` | boolean | 活动状态 |
| `archived` | boolean | 归档集合成员 |
| `pinned` | boolean | 置顶集合成员 |

## Session log export

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `directory` | string | 本次导出的绝对目录 |
| `sessionId` | string | 主会话 id |
| `main` | string | 主会话文件绝对路径 |
| `files` | array | 每项 `{ path, sessionId, role: 'main' \| 'subagent' }` |
| `subagentCount` | number | 后代会话数 |

文件：

- 根：`session.jsonl`（格式版本 0）或 `session.vN.jsonl`。
- 后代：`subagents/<sessionId>/session[.vN].jsonl`。
- 首行：`{ type: 'session', version, id, createdAt, cwd?, parentSession?, isSeeded, origin?, delegationDepth, agentPreset? }`。
- 其后每行一个事件，按 `seq` 升序。
- 不写附件与媒体。

状态：

1. 读取会话树，得到目标与后代。
2. 对每个活动会话落盘。
3. 读完整日志，序列化，写文件。
4. 返回目录与文件清单。

## Session operations

| 操作 | 输入 | 返回 | 失败条件 |
| --- | --- | --- | --- |
| 新建 | `workspace_id?`、`cwd?`、`agent_preset?`、`title?`、`prompt?` | `{ sessionId, agentPreset?, title?, prompted }` | 位置互斥、创建失败、首条消息投递失败 |
| 停止 | `session_id` | `{ accepted: true, sessionId }` | 载体失败 |
| 发送 | `session_id`、`text`、`mode?` | `{ delivered: true, sessionId, mode }` | 空文本、投递失败、会话已归档 |
| 置顶 | `session_id`、`remove?` | `{ pinned, sessionId }` | 会话不存在、会话已归档 |
| 归档 | `session_id`、`remove?`、`stop_activity?` | `{ archived, sessionId }` | 会话不存在、仍有工作且未停止 |

约束：

- 置顶与归档互斥：归档会移除置顶；置顶已归档会话失败。
- 归档保留目录与全部会话日志，只影响列表可见性。
- 停止只取消当前轮次，排队消息保留；空闲会话视为已接受。

## 状态集合

- 归档集合：注册表全局，`archiveSession` 加入、`unarchiveSession` 移除。
- 置顶集合：注册表全局，`pinSession` 前插、`unpinSession` 移除。
- 两者持久化，跨会话保留。

## 前端字典

| 键 | 中文 | 英文 |
| --- | --- | --- |
| `config.summary` | 选择向模型开放哪些工具 | Choose which tools the model can call |
| `config.workspace_list.label` | 获取工作区信息 | Get workspace info |
| `config.workspace_create.label` | 注册工作区 | Register a workspace |
| `config.workspace_remove.label` | 删除工作区 | Delete a workspace |
| `config.workspace_rename.label` | 重命名工作区 | Rename a workspace |
| `config.session_list.label` | 获取会话信息 | Get session info |
| `config.session_get.label` | 获取会话日志 | Get session log |
| `config.session_create.label` | 新建会话 | Create a session |
| `config.session_stop.label` | 停止会话 | Stop a session |
| `config.session_send.label` | 发送消息 | Send a message |
| `config.session_pin.label` | 置顶会话 | Pin a session |
| `config.session_archive.label` | 归档会话 | Archive a session |
| `config.unavailable` | 插件配置不可用。 | Plugin settings are unavailable. |
| `config.readOnly` | 此部署以只读方式保存设置。 | This deployment stores settings read-only. |
| `config.saveFailed` | 此部署未接受这些值，已保留以便修改。 | The deployment did not accept these values; they were left for you to correct. |
| `config.save` | 保存 | Save |
| `config.saving` | 保存中… | Saving… |

## 元数据

| 键 | 中文 | 英文 |
| --- | --- | --- |
| `meta.title` | 为模型提供元工具 | Meta tools for the model |
| `meta.description` | 让Agent能够操作工作区和会话 | Lets the agent operate workspaces and sessions |