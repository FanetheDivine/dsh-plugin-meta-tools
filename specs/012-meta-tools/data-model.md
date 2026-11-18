# Data Model: 模板转化为工作区与会话工具插件

## 插件配置

配置存放在插件行的 `config`，由宿主以热重载引用传入。

| 键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `workspace_list` | boolean | `true` | 是否注册 `workspace_list` |
| `workspace_create` | boolean | `true` | 是否注册 `workspace_create` |
| `workspace_remove` | boolean | `true` | 是否注册 `workspace_remove` |
| `workspace_rename` | boolean | `true` | 是否注册 `workspace_rename` |
| `session_list` | boolean | `true` | 是否注册 `session_list` |
| `session_get` | boolean | `true` | 是否注册 `session_get` |

校验规则：

- 缺省、`undefined` 或 `null` 的键取默认值 `true`。
- 值为非布尔类型时报错，插件加载失败。
- 出现六个键之外的键时报错，插件加载失败。
- 解析结果冻结后返回。
- 六个字段都标记 `.volatile()`，保存后触发热重载。

## 工作区视图

| 字段 | 类型 | 来源 |
| --- | --- | --- |
| `id` | string | 注册表记录 id |
| `title` | string | 显示标题 |
| `path` | string | 规范化绝对路径 |
| `status` | `'ok' \| 'missing-dir'` | `workspace.status()` 的实时目录检查 |
| `sessionCount` | number | `sessionIds.length` |
| `archivedSessionCount` | number | 注册表归档集合与 `sessionIds` 的交集 |
| `pinnedSessionCount` | number | 注册表固定集合与 `sessionIds` 的交集 |
| `createdAt` | string | ISO-8601 |
| `updatedAt` | string | ISO-8601 |

工具结果：

| 工具 | 结果字段 |
| --- | --- |
| `workspace_list` | `count`、`workspaces[]` |
| `workspace_create` | `created`、`workspace`、可选 `note` |
| `workspace_rename` | `workspace` |
| `workspace_remove` | `removed`、`removedId`、`path` |

## 会话记录

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `header.id` | string | 会话 id |
| `header.cwd` | string，可选 | 记录的绝对工作目录 |
| `header.createdAt` | number | epoch 毫秒，输出转 ISO-8601 |
| `header.agentPreset` | string，可选 | 会话使用的预设 |
| `live` | boolean | 是否存在于 `ctx.sessions` |
| `persisted` | boolean | 是否由持久化后端列出 |

派生集合：

- `archived`：`workspaceRegistry.archivedSessionIds`。
- `pinned`：`workspaceRegistry.pinnedSessionIds`。

## 会话列表结果

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `total` | number | 过滤后的总数 |
| `returned` | number | 本页数量 |
| `note` | string，可选 | 标题读取失败的说明 |
| `sessions[].id` | string | 会话 id |
| `sessions[].title` | string，可选 | 折叠标题 |
| `sessions[].cwd` | string，可选 | 工作目录 |
| `sessions[].createdAt` | string | ISO-8601 |
| `sessions[].live` | boolean | live 或 stored |
| `sessions[].archived` | boolean | 是否归档 |
| `sessions[].pinned` | boolean | 是否固定 |

约束：

- 按 `createdAt` 降序。
- `limit` 取整并夹在 1–100，默认 20。
- 默认过滤归档会话。
- 标题读取只在本页不超过 40 个会话且 `titles !== false` 时执行；按会话隔离失败。

## 会话详情结果

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 会话 id |
| `title` | string，可选 | 折叠标题 |
| `cwd` | string，可选 | 工作目录 |
| `createdAt` | string | ISO-8601 |
| `agentPreset` | string，可选 | 预设 |
| `live` | boolean | 是否在 `ctx.sessions` 中 |
| `archived` | boolean | 是否归档 |
| `pinned` | boolean | 是否固定 |
| `eventCount` | number | `capturedThroughSeq + 1`，空日志为 0 |
| `messages` | array，可选 | `messages` 参数为 0 时省略 |

消息字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `role` | `'user' \| 'assistant'` | 事件类型决定 |
| `text` | string | 文本块按换行拼接并去首尾空白 |
| `truncated` | boolean，可选 | 单条超过 2000 字符时出现 |

消息规则：

- 只取 `user/message` 与 `assistant/message` 事件中的文本块。
- 从最新事件向前收集，条数夹在 0–50，默认 10；结果为时间正序。
- 单条超过 2000 字符时截断并追加 `… [truncated]`。
- 总预算 12000 字符，超出预算的消息文本替换为 `… [omitted: result budget reached]`。

## 状态与转换

- 工具组未注册 → 服务可用且开关开启 → 注册六个工具中启用的项。
- 开关关闭 → 释放该工具的注册；重新开启 → 重新注册。
- 服务缺失 → 不注册该组，插件保持加载。
- 服务卸载 → 释放该组全部注册。
- 标题读取失败且未取消 → 列表仍返回，附 `note`。
- 调用被取消 → 标题与列表读取抛出取消，不吞掉。