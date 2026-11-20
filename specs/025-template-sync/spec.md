# Feature Specification: 同步模板热更新实机流程与前端链接规则

**Feature Branch**: `docs/025-template-sync`

**Created**: 2026-11-20

**Status**: Waived

**Input**: User description: 「D:\\Git\\self\\dsh-plugin-template 本项目基于此模板构建。查看模板最近的两个 commit 将相关变更迁移到本项目。」

参照提交：

- `fe93cd0 feat/020 hot plugin update`：实机 skill 改为链接安装并启用 HMR，新增迭代说明、热更新用例与排错，每轮结束删除 profile。
- `197480e docs(021)`：`docs/development.md` 增加前端 UI 链接使用完整 URL 的规则。

## Open Decisions

无未决项。决策记录见 Clarifications。

## Clarifications

### Session 2026-11-20

用户放弃访谈，要求只加热更新能力，前端文档一并修改。以下决策按推荐值采用：

- [D-001] Q: 热更新验证用哪个可见行为？ -> A: 改 `src/client/locales.ts` 的配置页文案，构建后在已打开的配置页观察，页面不刷新；后端替换以插件仍激活、GUI 进程号不变佐证。
- [D-002] Q: 模板遗留的 `demo_echo`、`prefix`、`demoEnabled` 用例是否本次适配？ -> A: 不适配，另开需求。
- [D-003] Q: 本轮是否做实机验证？ -> A: 做最小验证：链接安装、补丁含 `hmr`、构建后配置页文案更新。
- [D-004] Q: 是否复制模板的 spec 产物？ -> A: 不复制，按本项目流程写 025。
- [D-005] Q: 前端链接示例 URL？ -> A: `https://github.com/FanetheDivine/dsh-plugin-meta-tools`。
- [D-006] Q: `docs/development.md` 的「热更新」小节是否补充链接安装说明？ -> A: 不补充，实机流程归 skill。

## Review Record

- 2026-11-20 | Decision: Waived | Scope: current full document | Open items: D-001 到 D-006 按 Clarifications 的推荐值 | Risks: 热更新观察点只覆盖前端文案；后端热替换依赖 hmr 日志与进程号间接确认；skill 其余模板用例仍未适配

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 实机迭代不再重装与重启 (Priority: P1)

Agent 按实机 skill 搭建一个 profile 并启动 GUI。之后修改插件代码，只运行一次构建，同一 GUI 实例就按新代码工作；前端界面自动更新，会话与宿主进程保持不变。

**Why this priority**: 每次改动都重装插件并重启宿主，实机验证的迭代成本高于编写代码本身，长会话也会被打断。

**Independent Test**: 按 skill 搭建并启动 GUI，在会话中记录当前行为；改一处插件代码并构建；再次触发同一行为，结果按新代码变化，GUI 进程号与会话不变。

**Acceptance Scenarios**:

1. **Given** profile 用链接安装且 `cordis.patch.yml` 监听仓库 `dist`，**When** 仓库构建成功，**Then** 运行中的实例在数秒内加载新插件，宿主进程不重启。
2. **Given** 实例中有进行中的会话，**When** 热更新完成，**Then** 会话历史、工作区与连接保持可用。
3. **Given** 前端产物被重新构建，**When** 热更新完成，**Then** 已打开的页面显示新前端，无需手动刷新。
4. **Given** skill 的迭代步骤，**When** Agent 照做，**Then** 步骤中不出现重装插件或重启宿主。

---

### User Story 2 - 热更新失败时能自查 (Priority: P2)

构建后行为没变或插件不可用时，Agent 在 skill 的排错表中按现象找到原因与处理，不退回重装与重启。

**Why this priority**: 热更新依赖链接安装与 HMR 配置，缺一项就静默加载旧产物；没有排错表时只能重装。

**Independent Test**: 停用 HMR 条目后构建，按排错表判定「profile 不是链接安装或缺 `hmr` 条目」；恢复条目后热更新生效。

**Acceptance Scenarios**:

1. **Given** 构建成功但行为不变，**When** 查排错表，**Then** 能找到「链接安装」与「`hmr` 条目」两条检查项。
2. **Given** 只改了 `src` 没有构建，**When** 查排错表，**Then** 能看到「运行 `pnpm build` 或保持 `pnpm dev`」的处理。
3. **Given** 仓库路径含点目录，**When** 查排错表，**Then** 能看到 HMR 忽略点目录的说明。

---

### User Story 3 - 前端链接在 Desktop 中可打开 (Priority: P2)

开发插件前端界面的 Agent 查阅 `docs/development.md`，在「前端 UI 链接」读到 `a` 标签的 `href` 必须写完整 URL 及原因，按规则写出的链接在 Desktop 中点击即可打开目标。

**Why this priority**: Desktop 用应用内地址加载前端页面，相对链接指向应用地址，点击后打不开目标。

**Independent Test**: 在 `docs/development.md` 的「前端构建」之后读到「前端 UI 链接」小节，含完整 URL 的要求、示例与本项目原因。

**Acceptance Scenarios**:

1. **Given** 开发者按文档编写前端 UI，**When** 添加指向外部页面的链接，**Then** `href` 是带协议与主机的完整 URL。
2. **Given** 文档读者查阅前端章节，**When** 阅读「前端 UI 链接」，**Then** 读到要求、示例 URL 与 Desktop 的原因。

---

### User Story 4 - 每轮实机结束删除 profile (Priority: P3)

一轮实机测试结束时，Agent 先写报告并保存截图，再结束 GUI，最后删除 profile；下一轮重新搭建。

**Why this priority**: 旧 profile 保留打包安装与旧配置，链接安装与 HMR 只在新建或补齐后生效。

**Independent Test**: 按 skill 收尾后检查 profile 目录不存在，报告与截图仍在。

**Acceptance Scenarios**:

1. **Given** 一轮实机测试结束，**When** 执行清理步骤，**Then** profile 被删除，报告与截图保留。
2. **Given** 已有 profile 缺 `hmr` 条目，**When** 重新运行搭建脚本，**Then** 补丁补齐 HMR 配置，不改动其余条目。

### Edge Cases

- 已有 profile 的 `cordis.patch.yml` 只有 `[]` 占位：补齐前先移除孤立占位行。
- 仓库路径含 `.dsh` 等点目录：HMR 默认忽略 `**/.*`，排错表给出调整方式。
- 构建失败或替换导入失败：旧代码继续工作，修正后再次构建自动恢复。
- 只改 `src` 未构建：实例行为不变，skill 要求构建后再观察。
- 热更新验证用的临时文案改动在验证后还原，不进入提交。
- 链接安装下 A1 通过符号链接读取版本与 `dist` 哈希，断言保持有效。
- Windows + Git Bash：`dsh plugin add` 接收 `cygpath -m` 形式的仓库路径。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `setup-env.sh` MUST 用链接方式安装被测插件，`dsh plugin --profile <name> add <仓库路径>`，删除 `pnpm pack` 与 tgz 安装。
- **FR-002**: `setup-env.sh` MUST 让 `cordis.patch.yml` 含 `- id: hmr`，`config.root` 指向仓库 `dist`；新建补丁与已有补丁都适用。
- **FR-003**: 复用已有补丁且缺 `hmr` 条目时，脚本 MUST 补齐该条目，并先移除孤立的 `[]` 占位行。
- **FR-004**: `setup-env.sh` 结尾提示 MUST 写明构建后自动生效、轮次结束删除 profile。
- **FR-005**: `run-test.mjs` 的 A1 用例 MUST 用「加载的版本」与「加载的产物」表述，断言保持版本与哈希一致。
- **FR-006**: `SKILL.md` 阶段 0 与阶段 1 MUST 说明构建是迭代动作、链接安装与 HMR 监听 `dist`。
- **FR-007**: `SKILL.md` MUST 新增迭代小节：`pnpm build` 或 `pnpm dev` 后同一实例替换后端与前端，不重装、不重启，并给出一次热更新验证步骤。
- **FR-008**: 该验证步骤 MUST 修改 `src/client/locales.ts` 的配置页文案，构建后在已打开的配置页观察新文案，不引用模板的示例文件与 `ECHO_CASE` 标记。
- **FR-009**: `SKILL.md` 阶段 5 MUST 改为先写报告并保存截图、再结束 GUI、最后删除 profile。
- **FR-010**: `cases.md` MUST 增加热更新验证步骤，并在报告结构中加入「热更新验证」一节。
- **FR-011**: `pitfalls.md` MUST 增加热更新排错表，覆盖未生效、不可用、未构建、前端未更新、点目录与补丁改动六类现象。
- **FR-012**: `docs/development.md` MUST 在「前端构建」之后新增「前端 UI 链接」小节：`a` 标签的 `href` MUST 使用完整 URL，示例 URL 为本项目仓库地址，并说明 Desktop 的原因。
- **FR-013**: `CHANGELOG.md` MUST 在 `Unreleased`/`Changed` 下新增两条：实机热更新流程、前端 UI 链接规则。
- **FR-014**: 迁移后的文档、脚本与提示 MUST 使用本项目的包名、仓库路径与宿主版本，不残留模板示例。

### Key Entities

- **实机 profile**：搭建脚本生成的隔离配置、链接安装记录与测试驱动脚本集合。
- **插件加载源**：宿主实际导入的产物位置；链接安装下即仓库 `dist`。
- **热更新事件**：构建产物变化触发的一次插件替换，带成功或失败结果。
- **前端 UI**：插件浏览器产物渲染的界面，含配置页与槽位组件。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 按 skill 完成一次插件改动，构建 1 次后同一 GUI 实例生效，重装与重启次数为 0。
- **SC-002**: 新建 profile 与复用旧 profile 两种情况下，`cordis.patch.yml` 都含指向仓库 `dist` 的 `hmr` 条目。
- **SC-003**: 按 skill 收尾后 profile 目录不存在，报告与截图保留。
- **SC-004**: 查阅 `docs/development.md` 一次即可读到前端链接要求、示例与原因。
- **SC-005**: `pnpm check` 通过，插件源码与产物不变。

## Assumptions

- 宿主为 `0.2.2-rc.3`，与 `package.json` 的 `@deepseek-ai/dsh-agent` 一致；不一致时搭建脚本安装到 `~/.dsh-local`。
- 本机有 Chrome 与仓库内的 `playwright`，GUI 由 `gui-up.sh` 启动。
- 仓库在搭建前已运行 `pnpm i && pnpm check`，`dist/` 与当前代码一致。
- 模板仓库只读；迁移以两个提交的 diff 为依据，不合并其他模板差异。
- 模板遗留的示例用例不并入本需求，按 D-002 的结论处理。
