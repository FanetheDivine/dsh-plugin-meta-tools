# Contract: 工具描述

## 完整文本

```text
workspace_list:
List the DSH (DeepSeek Harness) workspaces (project directories) with their ids, titles, paths, and session counts. Start here to obtain a workspace id for the other DSH workspace tools.

workspace_create:
Register an existing absolute directory as a DSH (DeepSeek Harness) workspace. Idempotent: a directory that is already registered returns its existing workspace with created false. Nothing is copied, moved, or deleted on disk, and no session is created.

workspace_remove:
Remove a DSH (DeepSeek Harness) workspace registration. The directory, its files, and every session history stay untouched; its sessions become ungrouped. Re-adding the same directory later creates a fresh workspace with an empty session list.

workspace_rename:
Change the display title of one registered DSH (DeepSeek Harness) workspace. Duplicate titles across workspaces are allowed; the directory path is unchanged.

session_list:
List DSH (DeepSeek Harness) sessions newest first, with ids, titles, and working directories. Filter by workspace, working directory, or a case-insensitive substring of the title. The calling session is omitted; subagent sessions appear as their main session. Stored titles are folded from session logs, so a title read can touch each listed session's log.

session_get:
Export one DSH (DeepSeek Harness) session log to a temporary directory and return the written file paths. The export contains the main session and one log per subagent session. Each file is JSONL: a header line followed by one event per line. Read the returned files to inspect the session.

session_create:
Create a DSH (DeepSeek Harness) session, optionally in a workspace or directory, with an agent preset, an optional provider/model/effort selection, a title, and a first prompt. Returns the new session id.

session_stop:
Cancel the current turn of one DSH (DeepSeek Harness) session without dropping its pending messages.

session_send:
Send one steering message to an ordinary DSH (DeepSeek Harness) session as a system reminder with source kind dsh-plugin-meta-tools. The text is wrapped in a <system-reminder> frame, and a closing tag inside the text is escaped. Running sessions receive it at the nearest step; idle sessions start a turn.

session_pin:
Pin a DSH (DeepSeek Harness) session to the top of its list, or remove the pin. A pinned session must exist and must not be archived.

session_archive:
Archive a DSH (DeepSeek Harness) session so it leaves the normal list, or restore an archived session. Archiving keeps the directory and every session log. A session with running work is refused unless stop_activity is true.
```

## 断言

- 每条描述同时包含 `DSH` 与 `DeepSeek Harness`。
- 工作区描述包含 `DSH (DeepSeek Harness) workspace`；会话描述包含 `DSH (DeepSeek Harness) session`。
- 名称、参数名、参数描述、输出与错误保持改动前的值。

## 不变项

- 十一个工具名与配置键。
- 参数 schema 与必填项。
- 输出 schema 与渲染函数。
- 插件元数据、配置页文案与开关。
