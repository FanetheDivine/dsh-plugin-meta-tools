# Feature Specification: 模板转化为工作区与会话工具插件

**Feature Branch**: `feat/012-meta-tools`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "按模板构造插件 要求功能完全等同于 @local/dsh-harness-tools"

**变更类别**: 模板转化（宪章原则 VII）

## Clarifications

### Session 2026-11-18

- Q: 本次转化是否移除模板自带的示例与前端，只交付与 `@local/dsh-harness-tools` 等同的六个宿主工具？ → A: 保留插件面板配置页，配置项按工具名称设置，每个工具一个开关，允许空值（空值按默认开启处理）。
- Q: 每个工具的开关在配置中的取值语义是什么？ → A: 六个键均为布尔，默认 true；未写或 null 按 true 处理，开关显示为开。
- Q: 模板的哪些示例部分保留？ → A: 只保留配置页；移除 `demo_echo`、agent 事件日志与输入区上方的示例行。
- Q: 是否本次执行宪章原则 VII 的发布设置？ → A: 全部执行：版本改为 0.1.0、恢复 CI 发布任务、删除历史 spec 与 CHANGELOG、提醒绑定 Trusted Publisher。
- Q: 是否把全部 `@deepseek-ai/dsh-*` 依赖升级到 npm 上的最新版本？ → A: 不升级，保持 0.2.2-rc.3。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 用工具管理工作区 (Priority: P1)

模型在对话中通过工具列出、添加、重命名和移除本 profile 的工作区，无需用户手工编辑 profile 配置。

**Why this priority**: 这是 `@local/dsh-harness-tools` 的核心能力之一，缺少它就无法称为功能等同。

**Independent Test**: 在真实宿主中调用 `workspace_list` 取得 id，再依次调用 `workspace_create`、`workspace_rename`、`workspace_list` 与 `workspace_remove`，核对每次返回与侧栏状态。

**Acceptance Scenarios**:

1. **Given** profile 已注册若干工作区，**When** 模型调用 `workspace_list`，**Then** 返回全部工作区的 id、标题、路径、状态、会话数、归档会话数与固定会话数，并可按 id 继续操作。
2. **Given** 一个已存在的绝对目录尚未注册，**When** 调用 `workspace_create`，**Then** 注册成功并返回 `created: true` 与新工作区的完整视图，磁盘内容不变。
3. **Given** 同一目录已注册，**When** 再次调用 `workspace_create`，**Then** 返回 `created: false` 与既有工作区，并说明目录已注册。
4. **Given** 调用 `workspace_create` 传入相对路径或空路径，**When** 参数非法，**Then** 调用失败并提示需要绝对路径。
5. **Given** 一个已注册工作区，**When** 调用 `workspace_rename` 修改标题，**Then** 标题更新，路径不变，允许与其他工作区重名。
6. **Given** 一个已注册工作区，**When** 调用 `workspace_remove`，**Then** 注册被移除，目录与全部会话日志保留，其会话变为未分组。
7. **Given** 传入不存在的工作区 id，**When** 调用任一按 id 操作的工具，**Then** 返回错误并提示先调用 `workspace_list`。

---

### User Story 2 - 用工具读取会话 (Priority: P1)

模型列出本 profile 的会话，按 id 读取某个会话的元数据与最新可见消息，用于回顾或继续工作。

**Why this priority**: 与工作区工具共同构成 `@local/dsh-harness-tools` 的完整能力，缺一不可。

**Independent Test**: 在真实宿主中调用 `session_list`，再对其中一个 id 调用 `session_get`，核对标题、工作目录、状态、事件数与消息内容。

**Acceptance Scenarios**:

1. **Given** profile 存在会话，**When** 调用 `session_list`，**Then** 按创建时间从新到旧返回一页会话，含 id、标题、工作目录、创建时间、live/stored、归档与固定状态。
2. **Given** 指定 `workspace_id`、`cwd` 与 `limit`，**When** 调用 `session_list`，**Then** 只返回符合筛选的会话，`limit` 在 1–100 内生效，默认 20。
3. **Given** 页内会话数超过 40 或调用方传 `titles: false`，**When** 列出会话，**Then** 跳过标题读取并照常返回其余字段。
4. **Given** 标题读取失败但调用未取消，**When** 列出会话，**Then** 返回列表并在结果中说明标题读取失败。
5. **Given** 一个会话 id，**When** 调用 `session_get`，**Then** 返回标题、工作目录、创建时间、预设、状态、事件数与最新若干条用户/助手消息。
6. **Given** `session_get` 的消息参数为 0，**When** 调用，**Then** 只返回元数据。
7. **Given** 单条消息超过 2000 字符或累计超过 12000 字符，**When** 读取会话，**Then** 单条截断并标记，超出总预算的消息替换为省略提示。
8. **Given** 传入不存在的会话 id，**When** 调用 `session_get`，**Then** 返回明确的读取失败提示。

---

### User Story 3 - 在插件面板开关工具 (Priority: P2)

用户在“插件”面板打开本插件的行详情，看到六个以工具名命名的开关，关闭其中一个后该工具从后续请求中消失，重新打开后恢复。

**Why this priority**: 用户明确要求配置项按工具名称逐项开关，且空值按默认开启处理。

**Independent Test**: 在真实宿主打开插件面板，关闭 `session_get` 并保存，新请求的工具列表不再含该工具；重新打开并保存后恢复。

**Acceptance Scenarios**:

1. **Given** 插件已加载，**When** 打开行配置页，**Then** 显示六个开关，键名与工具名一致，默认全部开启。
2. **Given** 某个开关关闭并保存，**When** 下一次请求准备工具，**Then** 对应工具不再注册，其他工具不受影响。
3. **Given** 保存后的配置缺少某个键或该键为 `null`，**When** 插件读取配置，**Then** 该工具按开启处理。
4. **Given** 配置含未知键或非布尔值，**When** 插件加载，**Then** 加载失败并给出明确错误。
5. **Given** 用户清空或删除配置文件中的某个键，**When** 宿主重新应用补丁，**Then** 该工具恢复为开启。

---

### User Story 4 - 以模板工程交付并完成转化 (Priority: P2)

插件作者获得与模板一致的工程结构：TypeScript 源码、单元测试、打包、CI、文档与可安装的 bundle；维护者得到与实际插件一致的仓库标识与发布设置。

**Why this priority**: 需求明确要求“按模板构造”，工程形态、仓库标识与发布设置都属于转化的交付内容。

**Independent Test**: 在仓库运行 `pnpm check` 与 `pnpm build` 通过；把构建产物安装到测试 profile 后，六个工具与配置页出现在新会话中；仓库中检索不到模板示例标识。

**Acceptance Scenarios**:

1. **Given** 仓库已完成转化，**When** 运行 `pnpm check`，**Then** 类型检查、lint 与全部测试通过。
2. **Given** 仓库已构建，**When** 运行 `pnpm build`，**Then** 生成宿主入口产物、前端产物与类型声明；发布内容只含约定的文件与展示资源。
3. **Given** 插件已作为 bundle 安装，**When** 用户在“插件”页查看，**Then** 看到本插件的标题、描述、图标与详情页。
4. **Given** 插件行被禁用，**When** 开始新的一步，**Then** 六个工具不再出现，已存数据不变。
5. **Given** 转化完成，**When** 查看包元数据、插件行与入口导出，**Then** 包名、行 id 与 `name` 一致，且不再出现 `dsh-plugin-template`。
6. **Given** 转化完成，**When** 检查宪章与 AGENTS，**Then** 示例相关原则与约定已删除或改写，项目定位变为实际插件。
7. **Given** 用户确认执行发布设置，**When** 检查仓库，**Then** 版本为 0.1.0、CI 的 `publish` 任务恢复 tag 触发、历史 spec 与 changelog 已清空，并收到 Trusted Publisher 绑定提醒。

---

### Edge Cases

- profile 没有 `workspaceRegistry` 服务时，工作区工具不注册，插件照常加载，会话工具仍可用。
- profile 没有 `sessionQuery` 服务时，会话工具不注册，工作区工具仍可用。
- 工作区目录已被移动或删除时，`workspace_list` 返回 `status: missing-dir`，不抛错。
- 工作区的会话 id 已不在会话索引中时，计数只按注册表记录的 id 统计。
- `session_list` 的 `workspace_id` 指向不存在的工作区时返回错误提示。
- `session_get` 读取的会话正在运行（live）时，元数据来自当前 surface。
- 取消信号触发时，标题读取与列表读取抛出取消，不吞掉。
- 工具的开关为关闭且服务缺失同时成立时，只按关闭处理，不报错。
- 与 `@local/dsh-harness-tools` 同时启用会产生同名工具冲突；本插件假定安装时移除旧插件行。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 插件 MUST 提供六个模型可调用工具：`workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename`、`session_list`、`session_get`。
- **FR-002**: 六个工具的名称、参数名、必填性、类型、默认值、取值范围、说明文本、错误提示、返回 JSON 字段与渲染文本 MUST 与 `@local/dsh-harness-tools` 1.0.0 完全一致。
- **FR-003**: `workspace_list` MUST 读取本 profile 的工作区注册表，返回 id、标题、路径、目录存在性状态、会话数、归档会话数与固定会话数，按注册表顺序排列。
- **FR-004**: `workspace_create` MUST 只注册已存在的绝对目录；已注册目录返回 `created: false`，不复制、移动或删除磁盘内容，也不创建会话。
- **FR-005**: `workspace_remove` MUST 只移除注册记录，保留目录与全部会话日志，并说明会话变为未分组。
- **FR-006**: `workspace_rename` MUST 只修改显示标题，允许重名，路径不变。
- **FR-007**: `session_list` MUST 按创建时间从新到旧列出会话，支持 `workspace_id`、`cwd` 筛选，`limit` 默认 20、范围 1–100，默认隐藏归档会话。
- **FR-008**: `session_list` MUST 默认读取本页最多 40 个会话的标题；页长超过 40 或 `titles: false` 时跳过读取；读取失败但未取消时以说明字段返回。
- **FR-009**: `session_get` MUST 返回会话元数据与最新可见用户/助手消息，`messages` 默认 10、范围 0–50；单条上限 2000 字符、总预算 12000 字符，截断与省略 MUST 明确标记。
- **FR-010**: 插件 MUST 在缺少工作区注册表或会话查询服务时跳过对应工具注册，并在服务可用时注册，不因缺少可选服务而加载失败。
- **FR-011**: 插件 MUST 注册为单个宿主插件行；禁用该行后，六个工具从后续步骤消失。
- **FR-012**: 插件 MUST 在入口导出 `Config`，包含六个布尔开关，键名与工具名一致，默认 `true`，并标记为热重载字段。
- **FR-013**: 配置中未写的键或值为 `null` 的键 MUST 按默认 `true` 处理；未知键与非布尔值 MUST 使插件加载失败。
- **FR-014**: 开关保存后 MUST 在宿主发出配置更新事件时重新注册或注销对应工具，不重启插件，不影响其他工具。
- **FR-015**: 前端 MUST 只保留插件面板的行配置页，提供六个开关与官方保存交互；输入区示例行、`demo_echo` 与 agent 事件日志 MUST 移除。
- **FR-016**: 插件 MUST 复用宿主提供的 `@deepseek-ai/dsh-tools` 实例，不把它打包进产物。
- **FR-017**: 仓库标识 MUST 改为实际插件：包名 `dsh-plugin-meta-tools`、插件行 id、入口 `name` 与 README 标题保持一致，且不再包含模板示例文案。
- **FR-018**: README MUST 描述六个工具、配置开关、安装方式、数据来源与限制；`docs/` MUST 同步工作机制、已知风险与开发说明。
- **FR-019**: 单元测试 MUST 覆盖六个工具的参数校验、正常路径、错误路径、截断与预算规则、可选服务缺失分支、六个开关的注册与注销、以及前端配置页接线。
- **FR-020**: 发布内容测试 MUST 确认 `dist`、`cordis.patch.yml`、`README.md` 与展示资源进包，`src`、`tests`、`scripts` 不进包。
- **FR-021**: 宪章与 AGENTS MUST 同步转化；发布设置 MUST 按确认结果执行：`version` 设为 0.1.0、CI 的 `publish` 任务恢复 tag 触发、删除 001–011 历史 spec 与 `CHANGELOG.md` 内容，并输出 Trusted Publisher 绑定提醒。
- **FR-022**: 全部 `@deepseek-ai/dsh-*` 依赖 MUST 保持 `0.2.2-rc.3`，不做版本升级。
- **FR-023**: 前端用户可见文案 MUST 全部来自 locale 字典；组件与逻辑代码 MUST NOT 含界面字符串字面量；中英文字典键集 MUST 一致，缺键或空文案 MUST 使测试失败。

### Key Entities

- **工作区记录**：本 profile 注册的一个项目目录，含 id、显示标题、规范化绝对路径、创建与更新时间、所属会话 id 列表。
- **会话记录**：一个会话的头部信息，含 id、工作目录、创建时间、预设与事件序列；会话内容按事件序列折叠得到标题与可见消息。
- **工具开关**：插件配置中与工具名同名的布尔项，决定该工具是否注册；空值表示使用默认开启。
- **工具结果**：每次调用的 JSON 值与其渲染文本；模型读取渲染文本，结构化字段用于后续调用。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 六个工具与 `@local/dsh-harness-tools` 的定义逐字段对比一致，自动化用例覆盖名称、参数、默认值、上限与错误文案。
- **SC-002**: 模型无需用户手工编辑 profile 即可完成一次“列出 → 创建 → 重命名 → 移除”工作区流程，且磁盘与会话日志不变。
- **SC-003**: 模型可在一次调用中取得一页会话摘要，并在一次调用中读取一个会话的最新 10 条消息。
- **SC-004**: 在插件面板关闭任一开关并保存后，下一次请求在 2 秒内不再包含该工具；重新打开后恢复。
- **SC-005**: `pnpm check` 与 `pnpm build` 全部通过，测试覆盖六个工具的成功与失败分支。
- **SC-006**: 安装到测试 profile 后，新会话第一个请求即可看到六个工具，禁用插件行后同类请求不再包含它们。
- **SC-007**: 仓库中检索不到 `demo_echo`、前端示例行等模板示例标识；历史 spec 与 changelog 按确认结果清空。
- **SC-008**: 发布设置核对通过：版本 0.1.0、CI 发布任务由 tag 触发、Trusted Publisher 提醒已给出。
- **SC-009**: 配置页在中文与英文下所有文案均由字典渲染，组件中检索不到界面字符串字面量。

## Assumptions

- 六个工具的行为基准是 `@local/dsh-harness-tools` 1.0.0 的实现，包含英文工具说明与错误文案。
- 插件保留客户端入口与插件面板配置页，移除输入区示例行；配置页是本次唯一的前端界面。
- 插件行 id 取 `dsh-plugin-meta-tools`，与包名和入口 `name` 一致。
- 现有 `@deepseek-ai/dsh-*` 依赖版本 `0.2.2-rc.3` 与运行中的 Desktop 宿主一致，本次不升级。
- 安装本插件前先移除 profile 中的 `@local/dsh-harness-tools` 行，避免同名工具冲突。
- 工作区注册表与会话查询服务由宿主提供；插件只读取与写入这两个服务暴露的数据。
- 历史 spec 与 changelog 清空后，本特性 spec 保留为仓库内唯一 spec。