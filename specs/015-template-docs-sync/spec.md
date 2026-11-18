# Feature Specification: 模板文档同步

**Feature Branch**: `docs/015-template-docs-sync`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "查看模板项目最近两个提交，仿照其修订本项目 spec 与文档。参照提交为 `e417c35`（宪章精简）与 `fde16ee`（主工作区约束与 main 同步）。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Constitution Check 只核对硬约束 (Priority: P1)

执行 `/speckit-plan` 的 Agent 逐条核对宪章，每条原则都是跨需求长期不变、可以检验的约束。

**Why this priority**: 实现规则有独立归属文档后，Constitution Check 只保留跨需求的硬约束。

**Independent Test**: 阅读宪章，原则只有宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条。

**Acceptance Scenarios**:

1. **Given** 宪章，**When** 列出原则，**Then** 依次为 I 宿主依赖版本、II 测试同步、III 文档结构、IV 质量门禁、V 公开引用。
2. **Given** 宪章，**When** 查找宿主契约、依赖归属、严格配置、工具契约、界面文案与本地化，**Then** 这些规则位于归属文档。
3. **Given** 宪章版本行，**When** 查看版本，**Then** 为 `2.0.0`。

---

### User Story 2 - 移出的规则仍能在归属文档中查到 (Priority: P1)

开发者在 `docs/` 中查到宿主契约、依赖归属、严格配置、工具契约与国际化规则，现行文档的编号引用都指向正确原则。

**Why this priority**: 每条规则有唯一归属后，维护者能完整查到约束，文档之间保持一致。

**Independent Test**: 逐条列出被移出原则的规则，每条都能在一个归属文档中找到；现行文档不存在指向已删除原则的引用。

**Acceptance Scenarios**:

1. **Given** 原宿主契约、依赖归属与严格配置规则，**When** 查阅 `docs/how-it-works.md`，**Then** 每条规则都能找到。
2. **Given** 当前十一个工具的契约要求，**When** 查阅 `docs/how-it-works.md`，**Then** 能找到契约回归、同名开关、兼容性说明与用户确认规则。
3. **Given** 原国际化原则，**When** 查阅 `docs/i18n.md`，**Then** 每条约束都能找到，工具契约文案链接到工具契约归属节。
4. **Given** 现行文档、skill 与扩展命令，**When** 查找宪章原则编号的引用，**Then** 每处编号都指向重新编号后的正确原则。

---

### User Story 3 - 主工作区只用于同步 (Priority: P1)

Agent 在任何会话中收到变更要求时，从 `AGENTS.md` 得知主工作区约束，把全部改动放进 worktree。

**Why this priority**: 主工作区是所有 worktree 的创建起点与清理落点，需要保持稳定基线。

**Independent Test**: 只读 `AGENTS.md`，能列出主工作区的约束与允许的 git 操作。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 查找主工作区约束，**Then** 看到主工作区 MUST 位于 `main` 分支。
2. **Given** `AGENTS.md`，**When** 查找主工作区约束，**Then** 看到 `git status --porcelain` 输出为空。
3. **Given** `AGENTS.md`，**When** 查找主工作区允许的操作，**Then** 看到 `git fetch` 与 `git pull`。
4. **Given** `AGENTS.md`，**When** 查找变更位置，**Then** 看到任何变更 MUST 在 worktree 中进行，文档、配置、spec 与代码同样适用。
5. **Given** 宪章，**When** 查找主工作区约束，**Then** 找不到相关条目，原则总数保持五条。

### Edge Cases

- 历史 `specs/` 与已有 CHANGELOG 条目中的旧原则编号保持原样。
- 本仓库是实际插件，工具契约规则迁入 `docs/how-it-works.md`，无需新增模板转化文档。
- 被 `.gitignore` 忽略的文件不计入主工作区未提交改动。
- 本次只修订文档与流程说明，不声明 worktree 扩展已经自动同步 `main`。

## Requirements *(mandatory)*

### Functional Requirements

**宪章**

- **FR-001**: 宪章原则 MUST 依次为 I 宿主依赖版本、II 测试同步、III 文档结构、IV 质量门禁、V 公开引用。
- **FR-002**: 原则 II–V 的条款 MUST 与原原则 IV、V、VI、VIII 一致，仅更新原则编号引用。
- **FR-003**: 原则 I MUST 规定全部 `@deepseek-ai/*` 依赖以同版本 `@deepseek-ai/dsh` 为准，全部 `@deepseek-ai/dsh-*` 依赖使用同一确切版本，并以同版本列入 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。
- **FR-004**: 宪章 MUST 删除原原则 I、II、III、VII、IX，以及「`@deepseek-ai/*` 依赖在该发布中没有对应版本时移除」的规则。
- **FR-005**: 宪章修订 MUST 经 `/speckit-constitution` 进行，版本按 MAJOR 升到 `2.0.0`。

**规则迁移**

- **FR-006**: 原宿主契约、依赖归属与严格配置规则 MUST 在 `docs/how-it-works.md` 中有完整表述。
- **FR-007**: 原工具契约规则 MUST 在 `docs/how-it-works.md` 中有完整表述，工具数量按当前十一个工具书写，契约回归以 `tests/contract.test.ts` 为准。
- **FR-008**: 原国际化原则的约束 MUST 在 `docs/i18n.md` 中有完整表述。
- **FR-009**: 现行文档、skill 与扩展命令中的宪章原则编号引用 MUST 指向重新编号后的原则；指向已删除原则的引用 MUST 改为链接归属文档。
- **FR-010**: `docs/known-risks.md` MUST 链接宿主依赖版本与依赖复用规则的归属位置。

**主工作区**

- **FR-011**: `AGENTS.md` MUST 规定主工作区位于 `main` 分支。
- **FR-012**: `AGENTS.md` MUST 规定主工作区干净，判定依据为 `git status --porcelain` 输出为空。
- **FR-013**: `AGENTS.md` MUST 规定主工作区只允许 `git fetch` 与 `git pull`。
- **FR-014**: `AGENTS.md` MUST 规定任何变更都在 worktree 中进行，文档、配置、spec 与代码同样适用。
- **FR-015**: 主工作区约束 MUST 只写在 `AGENTS.md`，宪章不增加对应原则。

**回归**

- **FR-016**: `docs/development.md` 的测试要求 MUST 引用原则 II，Spec Kit 流程说明 MUST 与当前扩展行为一致。
- **FR-017**: 变更 MUST 通过 `pnpm format && pnpm check`。

### Key Entities

- **宪章原则**：Constitution Check 与 analyze 逐条核对的硬约束。
- **归属文档**：按文档结构原则承载某条规则的唯一文档。
- **主工作区**：`git worktree list` 的第一项，即仓库根目录的检出。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 宪章原则数为 5，版本为 `2.0.0`。
- **SC-002**: 被移出原则的规则 100% 能在一个归属文档中找到。
- **SC-003**: 现行文档、skill 与扩展命令中指向错误或已删除原则编号的引用数为 0。
- **SC-004**: Agent 只读 `AGENTS.md`，能在 1 分钟内回答主工作区分支、清洁状态、允许操作与变更位置。
- **SC-005**: `pnpm check` 全部通过。

## Assumptions

- 本次范围是 spec、项目文档、扩展命令与对应 skill 的文档内容。
- 自动同步主工作区 `main` 的脚本、命令步骤与测试不在本次范围，`docs/development.md` 不声明该自动化已经存在。
- 依赖版本本身不升级，也不新增依赖回归测试。
- 历史 `specs/` 与已有 CHANGELOG 条目不修改。
- 工具契约迁移时把过时的「六个工具」改为当前「十一个工具」，不改变任何工具行为。
