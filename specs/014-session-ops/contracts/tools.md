# Contracts: 工具契约

**Feature**: [spec.md](../spec.md) | **Date**: 2026-11-18

全部工具说明为英文；参数名是模型可见契约，不得随意改动。返回类型 `json`；渲染只返回一个 `text` 内容块。错误以工具失败返回，消息为英文。

## 开关与服务

| 工具 | 开关键 | 必需服务 |
| --- | --- | --- |
| `workspace_list` | `workspace_list` | `workspaceRegistry` |
| `workspace_create` | `workspace_create` | `workspaceRegistry` |
| `workspace_remove` | `workspace_remove` | `workspaceRegistry` |
| `workspace_rename` | `workspace_rename` | `workspaceRegistry` |
| `session_list` | `session_list` | `sessionQuery` |
| `session_get` | `session_get` | `sessionQuery` |
| `session_create` | `session_create` | `sessionController` |
| `session_stop` | `session_stop` | `sessionController` |
| `session_send` | `session_send` | `sessionController` |
| `session_pin` | `session_pin` | `workspaceRegistry` |
| `session_archive` | `session_archive` | `workspaceRegistry` |

开关缺省或 `null` 为 `true`；未知键与非布尔值使插件加载失败。

## workspace_list

**Description**: List the registered workspaces (project directories) with their ids, titles, paths, and session counts. Start here to obtain a workspace id for the other workspace tools.

**Parameters**: 无。

**Returns**:

```json
{
  "count": 1,
  "workspaces": [
    {
      "id": "w1",
      "title": "app",
      "path": "C:\\projects\\app",
      "status": "ok",
      "sessionCount": 3,
      "archivedSessionCount": 0,
      "pinnedSessionCount": 1,
      "createdAt": "2026-11-18T00:00:00.000Z",
      "updatedAt": "2026-11-18T00:00:00.000Z"
    }
  ]
}
```

**Render**: `N workspace(s)`，逐项 `title — path` 与 `id: … · N session(s) · …`。

## workspace_create

**Description**: Register an existing absolute directory as a workspace. Idempotent: a directory that is already registered returns its existing workspace with created false. Nothing is copied, moved, or deleted on disk, and no session is created.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | Absolute path of an existing directory, for example C:\projects\app. |
| `title` | string | 否 | Display title. Defaults to the directory name. |

**Returns**: `{ created: boolean, workspace: WorkspaceView, note?: string }`。

**Errors**:
- `path must be an absolute path of an existing directory`（空或非绝对路径）。
- `Could not register '<path>' as a workspace: <reason>`（目录不存在、不是目录或注册失败）。

## workspace_remove

**Description**: Remove a workspace registration. The directory, its files, and every session history stay untouched; its sessions become ungrouped. Re-adding the same directory later creates a fresh workspace with an empty session list.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 是 | Workspace id from workspace_list. |

**Returns**: `{ removed: boolean, removedId: string, path: string }`。

**Errors**: `No workspace with id '<id>'. Call workspace_list for current ids.`

## workspace_rename

**Description**: Change the display title of one registered workspace. Duplicate titles across workspaces are allowed; the directory path is unchanged.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 是 | Workspace id from workspace_list. |
| `title` | string | 是 | New display title. |

**Returns**: `{ workspace: WorkspaceView }`。

**Errors**: 未知 id；`title must not be empty`。

## session_list

**Description**: List sessions newest first, with ids, titles, and working directories. Filter by workspace, working directory, or a case-insensitive substring of the title. The calling session is omitted; subagent sessions appear as their main session. Stored titles are folded from session logs, so a title read can touch each listed session's log.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 否 | Only sessions accounted by this workspace. Omit to list every session. |
| `cwd` | string | 否 | Only sessions whose recorded working directory equals this absolute path. |
| `query` | string | 否 | Case-insensitive substring of the stored title. Omit to list every session. |
| `limit` | integer | 否 | Maximum sessions to return, 1-100. Defaults to 20. |
| `titles` | boolean | 否 | Read stored titles (default true). Always read when query is given. |
| `include_archived` | boolean | 否 | Include archived sessions (default false). |

**Behavior**:

1. 列出全部会话；按 `workspace_id`、`cwd` 过滤。
2. 按父链归并到主会话，按主会话 id 去重。
3. 排除调用方会话；调用方是 subagent 时排除其主会话。
4. `query` 非空时读取标题并做大小写不敏感子串匹配；扫描上限 200，超出附 `note`。
5. 按创建时间倒序，`total` 为过滤与归并后的数量，取前 `limit` 条。

**Returns**:

```json
{
  "total": 2,
  "returned": 2,
  "note": "optional",
  "sessions": [
    {
      "id": "session-1",
      "title": "Fix login",
      "cwd": "C:\\projects\\app",
      "createdAt": "2026-11-18T00:00:00.000Z",
      "live": true,
      "archived": false,
      "pinned": false
    }
  ]
}
```

**Render**: `N of M session(s), newest first`；每项 `title — id` 与 `cwd · created … · live/stored · archived · pinned`；末尾附 `note`。

**Errors**: 未知工作区 id；工作区服务不可用。

## session_get

**Description**: Export one session log to a temporary directory and return the written file paths. The export contains the main session and one log per subagent session. Each file is JSONL: a header line followed by one event per line. Read the returned files to inspect the session.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | Session id from session_list. |

**Behavior**:

1. 读取会话树：目标、祖先、后代。
2. 对每个活动会话执行落盘屏障。
3. 读完整日志，写成规范 JSONL。
4. 输出目录：`<os.tmpdir()>/dsh-plugin-meta-tools/session-logs/<safeId>-<stamp>-<rand>/`。
5. 根文件 `session.jsonl` 或 `session.vN.jsonl`；subagent 文件 `subagents/<id>/session[.vN].jsonl`。

**Returns**:

```json
{
  "directory": "C:\\Users\\me\\AppData\\Local\\Temp\\dsh-plugin-meta-tools\\session-logs\\session-1-20261118T071500Z-ab12",
  "sessionId": "session-1",
  "main": "…\\session.v2.jsonl",
  "files": [
    { "path": "…\\session.v2.jsonl", "sessionId": "session-1", "role": "main" },
    { "path": "…\\subagents\\session-2\\session.v2.jsonl", "sessionId": "session-2", "role": "subagent" }
  ],
  "subagentCount": 1
}
```

**Render**:

```text
exported session session-1 to <directory>
<main path>
<subagent path>
2 files
```

**Errors**:
- `session_id must not be empty`
- `Could not read session '<id>': <reason>`
- `Could not write session logs to '<directory>': <reason>`

## session_create

**Description**: Create a session, optionally in a workspace or directory, with an agent preset, a title, and a first prompt. Returns the new session id.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `workspace_id` | string | 否 | Workspace the session joins. Exclusive with cwd; defaults to the calling session's working directory. |
| `cwd` | string | 否 | Absolute directory the session owns. Exclusive with workspace_id. |
| `agent_preset` | string | 否 | Agent preset the session runs. Defaults to the deployment default. |
| `title` | string | 否 | Display title for the new session. |
| `prompt` | string | 否 | First message sent after creation. Omit to create a blank session. |

**Returns**: `{ sessionId, agentPreset?, title?, prompted: boolean }`。

**Errors**:
- `workspace_id and cwd are mutually exclusive`
- `Could not create the session: <reason>`
- `The session '<id>' was created, but its first prompt failed: <reason>`

## session_stop

**Description**: Cancel the current turn of one session without dropping its pending messages.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | Session whose current turn to cancel. |

**Returns**: `{ accepted: true, sessionId }`；渲染 `stop requested for session <id>`。

**Errors**: `Could not stop session '<id>': <reason>`。

## session_send

**Description**: Send one message to a session as a system reminder. The text is wrapped in a `<system-reminder>` frame, and a closing tag inside the text is escaped. Queue delivers at the next turn; steer delivers at the nearest step.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | Session that receives the reminder. |
| `text` | string | 是 | Reminder text; wrapped in a system-reminder frame. |
| `mode` | string enum `queue` / `steer` | 否 | Delivery timing. queue waits for the next turn; steer targets the nearest step. Subagent delivery queues the reminder. Defaults to queue. |

**Returns**: `{ delivered: true, sessionId, mode }`；渲染 `system reminder delivered to session <id> (mode)`。

**Errors**:
- `text must not be empty`
- `Could not deliver the reminder to session '<id>': <reason>`

## session_pin

**Description**: Pin a session to the top of its list, or remove the pin. A pinned session must exist and must not be archived.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | Session to pin or unpin. |
| `remove` | boolean | 否 | Remove the pin instead of adding it. Defaults to false. |

**Returns**: `{ pinned: boolean, sessionId }`；渲染 `session <id> pinned` 或 `session <id> unpinned`。

**Errors**: `Could not pin session '<id>': <reason>`；归档会话的置顶错误原样返回并提示先解除归档。

## session_archive

**Description**: Archive a session so it leaves the normal list, or restore an archived session. Archiving keeps the directory and every session log. A session with running work is refused unless stop_activity is true.

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | Session to archive or restore. |
| `remove` | boolean | 否 | Restore the session from the archive instead of archiving it. Defaults to false. |
| `stop_activity` | boolean | 否 | Stop the session's running work before archiving. Defaults to false. |

**Returns**: `{ archived: boolean, sessionId }`；渲染 `session <id> archived` 或 `session <id> restored`。

**Errors**: `Could not archive session '<id>': <reason>`；运行中且未传 `stop_activity` 时提示先停止或传 `stop_activity: true`。