# Feature Specification: 会话元工具与会话日志导出

**Feature Branch**: `feat/014-session-ops`

**Created**: 2026-11-18

**Status**: Draft

**Input**: 用户描述（按轮次给出）：

1. 所有 server 改为可选，宿主不提供时不影响插件其余功能。
2. `session_get` 改为把主会话与 subagent 的日志 JSON 写入临时目录，供 AI 读取，不再把消息列表塞进工具结果。
3. `session_list` 按标题模糊匹配；忽略当前会话；subagent 会话以主会话出现。
4. 增加会话操作：新建、停止、发送消息（以 system-reminder 存在）、置顶、归档。
5. 所有描述去掉 “profile”。
6. 配置页文案改为：标题「为模型提供元工具」，描述「让Agent能够操作工作区和会话」，行摘要「选择向模型开放哪些工具」。
7. 删除六个开关标题；原描述改为短标签：获取工作区信息、注册工作区、删除工作区、重命名工作区、获取会话信息、获取会话日志。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 会话日志按 DSH 导出格式落盘 (Priority: P1)

模型需要通读一段会话及其全部 subagent 的日志。调用 `session_get` 后，插件把主会话与每个 subagent 的日志写成规范 JSONL 文件，放在系统临时目录，并在工具结果里返回这些文件的绝对路径。模型用文件读取工具逐份阅读，不再让大段消息占据工具结果。

**Why this priority**: 这是本轮唯一改变数据交付方式的需求；工具结果膨胀会挤掉上下文，文件读取可按需分段。

**Independent Test**: 对一个含 2 层 subagent 的会话调用 `session_get`，检查临时目录内存在主会话 JSONL 与每个 subagent 的 JSONL，首行是会话头，其后每行一个事件，工具结果只含路径。

**Acceptance Scenarios**:

1. **Given** 一个含 subagent 的会话，**When** 调用 `session_get`，**Then** 临时目录内生成主会话与全部后代 subagent 的 JSONL 文件，返回值列出每个文件的绝对路径。
2. **Given** 会话没有 subagent，**When** 调用 `session_get`，**Then** 只生成主会话 JSONL，文件清单长度为 1。
3. **Given** 会话 id 不存在，**When** 调用 `session_get`，**Then** 工具报错并说明会话不存在，不创建目录。
4. **Given** 临时目录不可写，**When** 调用 `session_get`，**Then** 工具报错并带上底层原因。
5. **Given** 目标会话正在运行，**When** 调用 `session_get`，**Then** 导出前先落盘当前日志，导出的文件包含最新事件。

### User Story 2 - 按标题定位会话 (Priority: P1)

模型只记得会话标题的一部分。调用 `session_list` 并给出标题片段，得到匹配的会话；结果不包含调用方自己的会话；subagent 会话不单独出现，而是归并到它所属的主会话。

**Why this priority**: 现有工具只能按工作区或目录过滤，标题搜索依赖模型逐条阅读。

**Independent Test**: 准备 3 个会话（标题分别含 `alpha`、`ALPHA`、`beta`），其中一个是当前会话，一个是某个主会话的 subagent；带 `query: alpha` 调用，结果只剩两个主会话，当前会话不出现，subagent 不单独出现。

**Acceptance Scenarios**:

1. **Given** 三个标题含 `alpha` 的会话，**When** 用 `query: ALPHA` 查询，**Then** 返回全部三个，大小写不影响匹配。
2. **Given** 当前会话标题也含查询词，**When** 调用 `session_list`，**Then** 结果不含当前会话；调用方是 subagent 时也不含它的主会话。
3. **Given** 一个主会话带两个 subagent，**When** 不带过滤条件调用，**Then** 只出现主会话一行，两个 subagent 不单独占行。
4. **Given** `query` 匹配不到任何标题，**When** 调用，**Then** 返回空列表且 `total` 为 0。
5. **Given** 候选会话超过标题扫描上限，**When** 调用，**Then** 结果附说明：只扫描了最新 N 个会话，可用工作区或目录缩小范围。

### User Story 3 - 模型直接管理会话 (Priority: P1)

模型新建会话、停止运行中的会话、向目标会话发送提醒、置顶会话、归档会话，都不需要用户切到界面操作。

**Why this priority**: 这些操作目前只能由用户在界面完成，模型无法编排跨会话工作。

**Independent Test**: 依次调用五个工具，检查新会话出现在列表中、目标会话停止运行、目标会话收到 system-reminder、置顶集合含目标 id、归档集合含目标 id。

**Acceptance Scenarios**:

1. **Given** 一个目录，**When** 调用 `session_create` 并给出 `cwd`，**Then** 返回新会话 id，该会话的目录等于给定路径。
2. **Given** 一个运行中的会话，**When** 调用 `session_stop`，**Then** 返回已接受，该会话的当前轮次被取消，排队消息保留。
3. **Given** 一个目标会话，**When** 调用 `session_send` 并给出文本，**Then** 目标会话收到一条用户消息，正文被 `<system-reminder>` 包裹；文本中的 `</system-reminder>` 被转义，不能提前闭合。
4. **Given** 一个未归档会话，**When** 调用 `session_pin`，**Then** 会话进入置顶集合；再次调用并传 `remove: true` 后离开置顶集合。
5. **Given** 一个空闲会话，**When** 调用 `session_archive`，**Then** 会话进入归档集合；传 `remove: true` 后恢复。
6. **Given** 一个运行中的会话，**When** 调用 `session_archive` 且不传 `stop_activity`，**Then** 工具报错并提示先停止或传 `stop_activity: true`。

### User Story 4 - 缺服务的部署照常工作 (Priority: P2)

部署没有组合工作区注册表或会话服务时，插件照常加载，其余工具与配置页正常工作；缺服务对应的工具不出现在工具表。

**Why this priority**: 插件此前已按此思路分组注册，本轮新增服务不得引入硬依赖。

**Independent Test**: 用最小 ctx（只有 `tools`）加载插件，插件不抛错，注册工具数为 0；补上 `sessionQuery` 后出现 `session_list`、`session_get`。

**Acceptance Scenarios**:

1. **Given** 只有 `tools` 服务，**When** 加载插件，**Then** 加载成功，不注册任何工具，配置页照常渲染十一个开关。
2. **Given** 有 `workspaceRegistry`、没有 `sessionQuery`，**When** 加载，**Then** 注册四个工作区工具，会话工具不出现。
3. **Given** 有 `sessionController`、没有 `workspaceRegistry`，**When** 加载，**Then** 注册新建、停止、发送三个工具，置顶与归档不出现。
4. **Given** 服务在运行中出现或消失，**When** 状态变化，**Then** 对应工具组补注册或整组释放。

### User Story 5 - 配置页与插件页文案更新 (Priority: P2)

用户在插件面板看到新标题、新描述与十一个单行开关标签；中英文都完整，切语言即时生效。

**Why this priority**: 文案是用户理解工具边界的唯一入口，旧标题与旧描述与本轮能力不符。

**Independent Test**: 打开插件行详情页，核对标题、描述、摘要与十一行标签；切到英文，核对对应英文。

**Acceptance Scenarios**:

1. **Given** 中文界面，**When** 打开本插件行，**Then** 标题为「为模型提供元工具」，描述为「让Agent能够操作工作区和会话」，行摘要为「选择向模型开放哪些工具」。
2. **Given** 中文界面，**When** 查看开关列表，**Then** 每行只有一段标签，依次为获取工作区信息、注册工作区、删除工作区、重命名工作区、获取会话信息、获取会话日志、新建会话、停止会话、发送消息、置顶会话、归档会话。
3. **Given** 英文界面，**When** 查看同一页面，**Then** 标题、描述、摘要与十一段标签均为对应英文，无空文案与键名。
4. **Given** 关闭任一开关并保存，**When** 查看模型工具表，**Then** 对应工具消失或出现，插件不重启。

### Edge Cases

- 调用方是 subagent 且其主会话不在会话列表中：仍按主会话 id 排除，不出现。
- 父链断开（父会话日志缺失）：以能追溯到的最高已知会话作为主会话，不丢弃该会话。
- 两个 subagent 属于同一主会话：列表中只出现主会话一行。
- 标题折叠失败：该会话不参与查询匹配，列表仍返回其余会话，并附说明。
- `session_get` 遇到没有事件的会话：写出的 JSONL 只有头行。
- `session_get` 的 subagent 层级很深：按层级全部导出，目录结构不随层级嵌套。
- 临时目录已有同名路径：每次导出使用独立目录，不覆盖上一次结果。
- 会话 id 含路径分隔符或保留字符：文件名使用安全化后的 id，原始 id 保留在 JSONL 头行与返回值。
- 归档一个已归档会话：幂等成功，不重复写入。
- 置顶一个已归档会话：报错并说明先解除归档。
- 向已归档会话发送消息：报错并说明会话已归档。
- 新建会话同时传 `workspace_id` 与 `cwd`：参数校验失败，提示二者互斥。
- 新建会话带首条消息但消息投递失败：报错并带上已创建的会话 id，便于后续重试。

## Requirements *(mandatory)*

### Functional Requirements

服务与配置：

- **FR-001**: 插件加载 MUST 只要求 `tools` 服务；`workspaceRegistry`、`sessionQuery`、`sessionController`、`sessions`、`subagents` MUST 全部可选。
- **FR-002**: 缺某服务时，依赖它的工具 MUST NOT 注册；其余工具与配置页 MUST 照常工作。
- **FR-003**: 每个工具 MUST 有一个同名配置开关，共十一个；缺省或 `null` 取 `true`；未知键与非布尔值 MUST 使插件加载失败。
- **FR-004**: 开关变化 MUST 在不重启插件的情况下同步工具注册；关闭的工具 MUST 从工具表消失。

会话列表：

- **FR-005**: `session_list` MUST 接受 `query` 参数，按折叠后的标题做大小写不敏感的子串匹配；`query` 为空或未传时不按标题过滤。
- **FR-006**: `session_list` MUST 排除调用方会话；调用方是 subagent 时 MUST 排除其主会话。
- **FR-007**: `session_list` MUST 把 subagent 会话归并到其主会话，同一主会话只出现一行；主会话取父链的最高已知会话。
- **FR-008**: `session_list` MUST 保留 `workspace_id`、`cwd`、`limit`、`titles`、`include_archived` 的现有语义；`query` 非空时 MUST 读取标题，忽略 `titles: false`。
- **FR-009**: 标题扫描 MUST 有数量上限；超过上限时结果 MUST 附说明，指出只扫描了最新若干会话。
- **FR-010**: 返回的 `total` MUST 是过滤与归并之后的数量，`returned` MUST 是本页数量。

会话日志导出：

- **FR-011**: `session_get` MUST 把主会话与全部后代 subagent 的日志写入系统临时目录，不写入工作区目录。
- **FR-012**: 每个会话 MUST 写成一个 JSONL 文件：首行是会话头，其后每行一个事件，与 DSH `/export` 的日志内容一致。
- **FR-013**: 文件名 MUST 使用当前格式版本的规范名（`session.jsonl` 或 `session.vN.jsonl`）；subagent 文件 MUST 位于 `subagents/<id>/` 下。
- **FR-014**: 每次调用 MUST 使用独立目录，避免覆盖上一次导出；返回 MUST 含目录与每个文件的绝对路径、会话 id 与主/从角色。
- **FR-015**: 导出前 MUST 对活动会话执行落盘屏障；会话不存在或写入失败时 MUST 报错。
- **FR-016**: 导出 MUST NOT 包含附件与媒体文件；日志中引用的附件保持原样。

会话操作：

- **FR-017**: `session_create` MUST 支持 `workspace_id`、`cwd`、`agent_preset`、`title`、`prompt`；`workspace_id` 与 `cwd` 互斥；未给位置时沿用调用方目录。
- **FR-018**: `session_create` MUST 在给出 `title` 时设置显示标题，在给出 `prompt` 时把首条消息投递到新会话，并返回新会话 id。
- **FR-019**: `session_stop` MUST 取消目标会话当前轮次，保留排队消息；目标空闲时视为已接受。
- **FR-020**: `session_send` MUST 把文本包进 `<system-reminder>` 帧后投递，并转义文本内的 `</system-reminder>`；默认排队投递，可选 `steer`。
- **FR-021**: `session_pin` MUST 支持置顶与取消置顶；置顶已归档会话 MUST 报错。
- **FR-022**: `session_archive` MUST 支持归档与解除归档；运行中的会话只在 `stop_activity: true` 时归档，否则报错提示先停止。

文案：

- **FR-023**: 面向模型的工具说明、参数说明、错误与渲染文本 MUST 为英文，且 MUST NOT 出现 “profile”。
- **FR-024**: 插件元数据标题 MUST 为「为模型提供元工具」，描述 MUST 为「让Agent能够操作工作区和会话」；英文 MUST 表达同一含义。
- **FR-025**: 配置页行摘要 MUST 为「选择向模型开放哪些工具」；中英文各一份。
- **FR-026**: 配置页 MUST 删除工具标题，每个开关只显示一段短标签；标签内容按用户给定顺序与措辞，新增工具依次为新建会话、停止会话、发送消息、置顶会话、归档会话。
- **FR-027**: 中英文字典键集 MUST 一致；新增或修改文案 MUST 同步字典与测试。
- **FR-028**: `package.json` 描述与 README MUST 去掉 “profile”，并覆盖十一个工具。

### Key Entities

- **Workspace**：注册目录，含 id、标题、路径、会话账本与目录状态。
- **Session**：会话，含 id、标题、目录、创建时间、预设、父会话、来源（普通/subagent）、运行状态、归档与置顶标记。
- **Session log**：会话日志，含头行与按 seq 排列的事件；导出为 JSONL 文件。
- **Subagent tree**：由父会话链组成的会话树，根为主会话，叶子为 subagent。
- **Temp export directory**：系统临时目录下的独立目录，含主会话与 subagent 的 JSONL 文件。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 在只提供 `tools` 的部署上加载插件，插件加载成功率 100%，注册工具数为 0。
- **SC-002**: 关闭任一开关并保存后，模型工具表在 1 秒内反映变化。
- **SC-003**: 对 100 个会话按标题片段查询，返回结果只含匹配项，且不含调用方会话与 subagent 行。
- **SC-004**: 含 2 层 subagent 的会话导出后，临时目录文件数与「主会话 + subagent 数」一致，AI 可直接读取每个文件。
- **SC-005**: 发送消息后，目标会话的下一条模型输入包含 `<system-reminder>` 帧，正文中的闭合标签无法提前结束帧。
- **SC-006**: 配置页十一个开关的文案与用户给定清单逐字一致，中英文均无空文案与键名。

## Assumptions

- 现有六个工具名保持不变；新增工具名为 `session_create`、`session_stop`、`session_send`、`session_pin`、`session_archive`。
- 用户给定的中文文案为准；英文按同义翻译，采用 sentence case。
- `session_get` 对齐 DSH `/export` 的日志内容与文件名，但不打包 ZIP，也不导出附件；目录树直接落盘供 AI 读取。
- 临时目录由操作系统清理，插件不主动删除历史导出。
- 标题扫描上限取 200，与现有「读取标题有成本」的提示一致。
- 配置页行标签同时作为开关的无障碍名称。
- 会话操作依赖的服务在部署中可能缺失；缺失时对应工具不注册，调用方不会看到这些工具。

### 兼容性影响

- 保留六个现有工具名，不重命名。
- `session_get` 的返回从「元数据 + 消息列表」改为「临时目录与文件路径」，参数去掉 `messages`；按用户要求变更，属有意不兼容。
- `session_list` 新增 `query` 参数，其余参数保持；返回字段与排序不变。
- 新增五个工具，各自新增同名开关；配置页新增五行。
- 与 `@local/dsh-harness-tools` 1.0.0 的同名工具不再完全兼容，同一部署只保留一个插件。