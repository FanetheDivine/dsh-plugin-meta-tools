# 工具契约

六个工具的定义 MUST 与 `@local/dsh-harness-tools` 1.0.0 一致。名称、说明、参数 schema、返回 JSON 与渲染文本按下表实现。

## workspace_list

- **说明**：`List the workspaces (registered project directories) of this DSH profile, with their ids, titles, paths, and session counts. Start here to obtain a workspace id for the other workspace tools.`
- **参数**：无
- **结果**：`{ count, workspaces[] }`，工作区字段见 [data-model.md](../data-model.md#工作区视图)
- **渲染**：

```text
2 workspaces
项目 A — D:\projects\a
  id: <uuid> · 3 session(s) · 1 archived · directory missing
```

- **错误**：无参数错误；目录检查失败按 `missing-dir` 呈现。

## workspace_create

- **说明**：`Register an existing absolute directory as a workspace in this DSH profile. Idempotent: a directory that is already registered returns its existing workspace with created false. Nothing is copied, moved, or deleted on disk, and no session is created.`
- **参数**：

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | `Absolute path of an existing directory, for example C:\projects\app.` |
| `title` | string | 否 | `Display title. Defaults to the directory name.` |

- **结果**：`{ created, workspace, note? }`
- **渲染**：`workspace created` 或 `workspace already registered`，随后 `path:`、`id:`、`N session(s)`、可选 `directory missing` 与 `note`
- **错误**：`path` 为空或不是绝对路径时抛 `ToolArgsError(['path must be an absolute path of an existing directory'])`；注册失败时返回 `Could not register '<path>' as a workspace: <原因>`

## workspace_remove

- **说明**：`Remove a workspace registration from this DSH profile. The directory, its files, and every session history stay untouched; its sessions become ungrouped. Re-adding the same directory later creates a fresh workspace with an empty session list.`
- **参数**：

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 是 | `Workspace id from workspace_list.` |

- **结果**：`{ removed, removedId, path }`
- **渲染**：`removed workspace <id>`、`path: <path>`、`The directory and its sessions were left in place; sessions are now ungrouped.`
- **错误**：id 不存在时返回 `No workspace with id '<id>'. Call workspace_list for current ids.`

## workspace_rename

- **说明**：`Change the display title of one registered workspace. Duplicate titles across workspaces are allowed; the directory path is unchanged.`
- **参数**：

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 是 | `Workspace id from workspace_list.` |
| `title` | string | 是 | `New display title.` |

- **结果**：`{ workspace }`
- **渲染**：`workspace renamed: <title>`，随后 `path:`、`id:`、`N session(s)`、可选 `directory missing`
- **错误**：id 不存在时返回同上；`title` 为空时抛 `ToolArgsError(['title must not be empty'])`

## session_list

- **说明**：`List sessions of this DSH profile, newest first, as titles with ids and working directories. Filter with workspace_id or cwd to narrow the page. Stored titles are folded from each listed session log, so keep limit small; pass titles false to skip that read.`
- **参数**：

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 否 | `Only sessions accounted by this workspace. Omit to list every session in the profile.` |
| `cwd` | string | 否 | `Only sessions whose recorded working directory equals this absolute path.` |
| `limit` | integer | 否 | `Maximum sessions to return, 1-100. Defaults to 20.` |
| `titles` | boolean | 否 | `Read stored titles (default true). False is faster on large histories.` |
| `include_archived` | boolean | 否 | `Include sessions hidden from workspace grouping (default false).` |

- **结果**：`{ total, returned, note?, sessions[] }`，字段见 [data-model.md](../data-model.md#会话列表结果)
- **渲染**：`<returned> of <total> session(s), newest first`，每个会话一行标题与 id，下一行 `cwd · created <ISO> · live|stored · archived · pinned`；结果含 `note` 时追加一行
- **错误**：`workspace_id` 不存在时返回 `No workspace with id '<id>'. Call workspace_list for current ids.`；无注册表服务时返回 `Workspace listing is unavailable in this profile.`

## session_get

- **说明**：`Read one session of this DSH profile by id: title, working directory, creation time, preset, event count, and optionally its latest model-visible user and assistant messages. Use session_list to find an id.`
- **参数**：

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | `Session id from session_list or a workspace listing.` |
| `messages` | integer | 否 | `How many of the newest visible user and assistant messages to include, 0-50. Defaults to 10; 0 returns metadata only.` |

- **结果**：`{ id, title?, cwd?, createdAt, agentPreset?, live, archived, pinned, eventCount, messages? }`，字段见 [data-model.md](../data-model.md#会话详情结果)
- **渲染**：`session <id>`、`title:`、`cwd:`、`created:`、可选 `preset:`、`state: live, archived, pinned`、`events: <n>`，随后每条消息以 `--- user ---` 或 `--- assistant ---` 分段
- **错误**：`session_id` 为空时抛 `ToolArgsError(['session_id must not be empty'])`；读取失败时返回 `Could not read session '<id>': <原因>`

## 公共约束

- 输出 schema 均为 `{ type: 'json' }`。
- 所有渲染输出单个 `text` 内容块。
- 取消信号在标题与列表读取中透传。