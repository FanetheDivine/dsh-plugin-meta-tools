# Phase 0 Research: 会话元工具与会话日志导出

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-18

## 宿主能力（DSH 0.2.2-rc.3）

结论来自宿主包内源码 `@deepseek-ai/dsh-session-log-export`、`dsh-session-controller`、`dsh-session-query`、`dsh-workspace` 与宿主 API 参考。

| 能力 | 宿主接口 | 结论 |
| --- | --- | --- |
| 新建会话 | `sessionController.create({ workspaceId?, cwd?, sessionId?, agentPreset? })` | 可用；`workspaceId` 与 `cwd` 互斥 |
| 停止会话 | `sessionController.cancel({ sessionId })` | 取消当前轮次，保留队列 |
| 发送消息 | `sessionController.prompt({ requestId, sessionId, mode, content })` | `mode` 为 `queue` 或 `steer`；正文是文本块 |
| 重命名会话 | `sessionController.rename({ sessionId, title })` | 可用于创建后设置标题 |
| 置顶 / 取消置顶 | `workspaceRegistry.pinSession(id)` / `unpinSession(id)` | 置顶要求会话存在且未归档 |
| 归档 / 解除归档 | `workspaceRegistry.archiveSession(id, { stopActivity? })` / `unarchiveSession(id)` | 归档运行中的会话需 `stopActivity: true` |
| 列会话 | `sessionQuery.listSessions(signal)` | 返回记录的头部含 `parentSession`、`origin` |
| 读标题 | `sessionQuery.readTitleSnapshots(ids, signal)` | 每项独立 fulfilled/rejected |
| 读完整日志 | `sessionQuery.readSession(id)` | 返回 `session` 头与完整 `events` |
| 查会话树 | `sessionQuery.traceSession(id)` | 返回 `ancestors`、`descendants`、`root` |
| 落盘屏障 | `sessions.flush(session)` | 活动会话导出前调用 |
| 临时目录 | Node `os.tmpdir()` | 不依赖宿主服务 |

## 决策

### D1 日志文件格式

- **Decision**: 每个会话写一个 JSONL：首行会话头，随后每行一个事件；文件名按格式版本 `session.jsonl`（v0）或 `session.vN.jsonl`；subagent 位于 `subagents/<id>/`。
- **Rationale**: 与宿主 `/export` 的内容与命名一致，AI 可用文件读取工具逐行阅读；磁盘目录树比 ZIP 更适合模型。
- **Alternatives considered**: ZIP 包（模型无法直接读）；单一大 JSON（无法分段读，且内存占用高）。

### D2 头行字段

- **Decision**: 头行写 `type`、`version`、`id`、`createdAt`、可选 `cwd`、可选 `parentSession`、`isSeeded`、可选 `origin`、`delegationDepth`（缺省 0）、可选 `agentPreset`，字段顺序与宿主序列化一致。
- **Rationale**: 与 DSH 物理 JSONL 头对齐，便于其他工具后续导入。
- **Alternatives considered**: 只写 id 与事件（丢失会话元数据）。

### D3 导出范围

- **Decision**: 主会话加 `traceSession` 返回的全部后代，按层递归；不导出附件与媒体。
- **Rationale**: 用户只要求消息 JSON；附件需要附件存储服务，超出本轮范围。
- **Alternatives considered**: 同时导出 `media/` 与 `files/`（对齐 ZIP 全量内容），但需要新增可选服务与文件流处理。

### D4 临时目录布局

- **Decision**: `os.tmpdir()/dsh-plugin-meta-tools/session-logs/<安全化 sessionId>-<UTC 时间戳>-<随机后缀>/`；根日志与 `subagents/<id>/` 目录树；每次调用独立目录。
- **Rationale**: 不污染工作区，避免覆盖上一次导出，路径可直接交给文件读取工具。
- **Alternatives considered**: 固定目录（会残留旧文件）；写入工作区 `.dsh/`（污染仓库）。

### D5 会话列表标题匹配

- **Decision**: 新增 `query` 参数，大小写不敏感的子串匹配；`query` 非空时读取标题，忽略 `titles: false`；标题扫描上限 200，超出时附说明。排序按创建时间倒序，过滤后计算 `total`。
- **Rationale**: 与用户要求一致，且避免无上限读取日志。
- **Alternatives considered**: 把 `titles` 改为查询参数（破坏契约）；全文搜索（匹配正文而非标题，超出需求）。

### D6 主会话归并

- **Decision**: 用记录的父链找最高已知祖先作为主会话，按主会话 id 去重；父链断开时以能追溯到的最高会话为准；排除调用方会话，调用方是 subagent 时排除其主会话。
- **Rationale**: 满足「subagent 则是主会话」，不依赖 `subagents` 服务，冷会话同样适用。
- **Alternatives considered**: 用 `subagents.rootOf(agent)`（只对活动 Agent 有效）；只归并一层父会话。

### D7 system-reminder 投递

- **Decision**: 文本包成 `<system-reminder>\n…\n</system-reminder>`，正文中的 `</system-reminder>` 转义为 `<\/system-reminder>`；`mode` 默认 `queue`，可选 `steer`；`requestId` 用随机 UUID。
- **Rationale**: 提供注入指令的可见边界，正文不能提前闭合帧。
- **Alternatives considered**: 纯文本投递（模型无法区分提醒与普通用户消息）；自建消息事件（需要更深的会话写接口）。

### D8 服务分组

| 工具 | 必需服务 |
| --- | --- |
| workspace_list / create / remove / rename | `workspaceRegistry` |
| session_pin / session_archive | `workspaceRegistry` |
| session_list / session_get | `sessionQuery` |
| session_create / session_stop / session_send | `sessionController` |

- **Decision**: 每组独立 `ctx.inject`，缺服务时整组不注册；配置开关再过滤一次。
- **Rationale**: 符合宪章 I 与用户「按工具粒度跳过」的选择。
- **Alternatives considered**: 始终注册并在调用时报错（用户已否决）。

### D9 配置与文案

- **Decision**: 十一个开关，键名与工具名一致；配置页删除标题行，每个开关只渲染一段标签；标签键为 `config.<tool>.label`；元数据与摘要按用户给定文案。
- **Rationale**: 与用户逐条给定内容一致，减少重复文案。
- **Alternatives considered**: 保留标题加说明双行（用户明确要求删除标题）。

### D10 测试

- **Decision**: 工具契约测试覆盖十一个工具；新增会话日志导出、会话列表归并、会话操作与可选服务的单元测试；客户端测试断言十一段标签与三种页状态。
- **Rationale**: 宪章 IV 要求代码变更同步测试，行为用真实模拟 ctx 验证。

### D11 依赖

- **Decision**: 不新增依赖；日志写盘使用 `node:fs/promises`、`node:os`、`node:path`，`requestId` 使用 `node:crypto`。
- **Rationale**: 全部为 Node 内置，不增加打包体积与宿主版本耦合。

## 未决项

无。用户已确认按工具粒度跳过服务、五个独立会话操作工具、`query` + 根会话归并、system-reminder 包裹；`session_get` 对齐 DSH 下载日志的内容与命名。