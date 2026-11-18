# Tasks: 会话元工具与会话日志导出

**Input**: Design documents from `specs/014-session-ops/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/tools.md](./contracts/tools.md)

**Tests**: 本仓库要求代码变更同步测试（宪章 IV），每个阶段包含对应测试。

**Organization**: 每个阶段对应一个 commit；阶段内 `[P]` 任务可并行。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无依赖）
- **[Story]**: 对应用户故事
- 描述含具体文件路径

## Path Conventions

单仓库：`src/`、`tests/`、`locale/`、`docs/` 均在仓库根。

---

## Phase 1: Setup（共享基础）

**Purpose**: 工具名、配置键、类型与界面文案骨架，保证后续阶段可独立编译。

- [x] T001 在 `src/constants.ts` 定义 11 个工具名、`TITLES_PAGE_LIMIT=200`、`MESSAGE_*` 移除后不再使用的常量清理、日志文件版本常量
- [x] T002 [P] 在 `src/types.ts` 增加 `SessionControllerLike`、`SessionsLike.flush`、`SessionHeaderLike.parentSession/origin/isSeeded/version/delegationDepth`
- [x] T003 [P] 在 `src/config.ts` 增加 11 个 volatile 开关与 `DEFAULT_CONFIG`
- [x] T004 在 `src/client/locales.ts` 改为 11 个 `config.<tool>.label` 键、`config.summary` 新文案、删除 `.title` 键
- [x] T005 [P] 在 `src/client/config-page.tsx` 改为单行标签渲染，`Switch.label` 使用同一文案
- [x] T006 [P] 在 `src/client/config-form.ts` 同步 11 个字段定义
- [x] T007 运行 `pnpm install`、`pnpm typecheck` 与 `pnpm test:code`，修正编译与既有测试

**Checkpoint**: 11 个开关可渲染，工具尚未全部注册。

---

## Phase 2: User Story 1 - 会话日志落盘 (P1)

**Goal**: `session_get` 把主会话与全部后代 subagent 的规范 JSONL 写入系统临时目录并返回路径。

**Independent Test**: 对含两层 subagent 的会话调用 `session_get`，目录内文件数与「主会话 + subagent」一致，首行是头对象。

- [x] T008 [US1] 新建 `src/session-log.ts`：会话树收集、头行序列化、JSONL 行序列化、临时目录命名与安全 id
- [x] T009 [US1] 在 `src/session-log.ts` 实现 `session_get` 工具：参数 `session_id`，落盘屏障、写文件、返回 `directory/main/files/subagentCount`
- [x] T010 [US1] 在 `src/index.ts` 注册 `session_get`；`SESSION_TOOL_NAMES` 保持 `session_list`、`session_get`
- [x] T011 [P] [US1] 新建 `tests/session-log.test.ts`：主会话、两层 subagent、无事件会话、未知 id、写盘失败、活动会话 flush
- [x] T012 [US1] 运行 `pnpm test:code tests/session-log.test.ts` 并修正

**Checkpoint**: 导出目录可直接被文件读取工具读取。

---

## Phase 3: User Story 2 - 标题查询与归并 (P1)

**Goal**: `session_list` 支持 `query` 子串匹配、排除调用方、subagent 归并到主会话。

**Independent Test**: 三个会话中两个标题含 `alpha`，其中一个是调用方，另一个是 subagent 的子会话；查询结果只剩两个主会话。

- [x] T013 [US2] 在 `src/session-tools.ts` 增加父链归并函数与调用方根会话解析
- [x] T014 [US2] 在 `src/session-tools.ts` 增加 `query` 参数、大小写不敏感子串匹配、扫描上限 200 与 `note`
- [x] T015 [US2] 在 `src/session-tools.ts` 接入排除逻辑与归并后的 `total/returned`
- [x] T016 [P] [US2] 更新 `tests/session-tools.test.ts`：大小写、排除调用方、subagent 归并、无匹配、扫描上限、`titles:false` 与 `query` 并存
- [x] T017 [US2] 运行 `pnpm test:code tests/session-tools.test.ts` 并修正

**Checkpoint**: 列表不再出现调用方与 subagent 行。

---

## Phase 4: User Story 3 - 会话操作 (P1)

**Goal**: 新建、停止、发送 system-reminder、置顶、归档五个工具可用。

**Independent Test**: 五个工具依次调用，状态在会话列表与注册表集合中体现。

- [x] T018 [US3] 新建 `src/session-ops.ts`：`session_create`（位置互斥、预设、标题、首条消息）
- [x] T019 [US3] 在 `src/session-ops.ts` 实现 `session_stop` 与 `session_send`（system-reminder 包裹与转义、queue/steer）
- [x] T020 [US3] 在 `src/session-ops.ts` 实现 `session_pin` 与 `session_archive`（remove、stop_activity）
- [x] T021 [US3] 在 `src/index.ts` 注册三个新工具组：controller 组与 registry 组
- [x] T022 [P] [US3] 新建 `tests/session-ops.test.ts`：创建、标题、首条消息失败、停止、发送包裹/转义/模式、置顶/取消、归档/恢复/运行中拒绝
- [x] T023 [US3] 运行 `pnpm test:code tests/session-ops.test.ts` 并修正

**Checkpoint**: 模型可完成跨会话编排。

---

## Phase 5: User Story 4 - 缺服务照常加载 (P2)

**Goal**: 只提供 `tools` 时插件加载成功；缺服务只跳过对应工具。

**Independent Test**: 最小 ctx 加载注册 0 个工具；逐个补服务，工具按组出现。

- [x] T024 [US4] 在 `src/index.ts` 移除对缺失服务的假设：每个 `ctx.inject` 内复查服务与开关
- [x] T025 [US4] 在 `src/index.ts` 处理服务晚到与卸载：组补注册、整组释放、热重载重建
- [x] T026 [P] [US4] 更新 `tests/plugin.test.ts`：仅 tools、仅 registry、仅 query、仅 controller、全服务、开关关闭、热重载
- [x] T027 [US4] 运行 `pnpm test:code tests/plugin.test.ts` 并修正

**Checkpoint**: 插件不因缺服务停用。

---

## Phase 6: User Story 5 - 配置页文案 (P2)

**Goal**: 插件页标题、描述、摘要与十一行标签按用户文案显示，中英双语完整。

**Independent Test**: 切换中英文核对标题、描述、摘要与 11 行标签；无标题残留与 `profile`。

- [x] T028 [US5] 更新 `locale/zh.json` 与 `locale/en.json` 的 `meta.title`、`meta.description`
- [x] T029 [P] [US5] 更新 `package.json` 描述，去掉 `profile`
- [x] T030 [US5] 复核 `src/client/locales.ts` 与 `src/client/config-page.tsx` 的 11 行标签与三种页状态
- [x] T031 [P] [US5] 更新 `tests/client.test.ts`、`tests/config.test.ts`、`tests/metadata.test.ts` 的文案断言
- [x] T032 [US5] 运行 `pnpm test:code` 并修正

**Checkpoint**: 配置页与元数据与用户清单逐字一致。

---

## Phase 7: Polish（文档与全量验证）

- [x] T033 更新 `tests/contract.test.ts`：11 个工具的名称、说明、参数与渲染
- [x] T034 [P] 更新 `README.md`：工具表、配置表、限制，去掉 `profile`
- [x] T035 [P] 更新 `docs/how-it-works.md`：四个工具组、导出流程、会话操作
- [x] T036 [P] 更新 `docs/known-risks.md`：临时目录、标题扫描、服务缺失、归档活动会话
- [x] T037 [P] 更新 `docs/i18n.md`：标签键与元数据变化
- [x] T038 搜索并清除工具说明、错误、README、locale 中的 `profile`
- [x] T039 运行 `pnpm format && pnpm check`
- [x] T040 运行 `pnpm full-check`，确认产物测试通过

---

## Dependencies & Execution Order

- Phase 1 阻塞所有阶段。
- Phase 2、3、4 可并行，但都改 `src/index.ts` 的不同片段，建议按顺序提交。
- Phase 5 依赖 Phase 2 与 4 的工具组。
- Phase 6 依赖 Phase 1 的字典键。
- Phase 7 依赖全部功能完成。

## Parallel Example

```text
T002 类型与 T003 配置可并行。
T011 导出测试与 T016 列表测试可并行。
T034–T037 四份文档可并行。
```

## Implementation Strategy

1. 先完成 Phase 1，保证编译不断。
2. 依次完成 Phase 2、3、4，每个阶段独立测试。
3. Phase 5 收紧可选服务。
4. Phase 6 收尾文案。
5. Phase 7 全量验证与文档。

## Notes

- 每个阶段一个 commit。
- 工具名与参数名是契约，改动先确认。
- 日志写盘只用 Node 内置模块，不写工作区。