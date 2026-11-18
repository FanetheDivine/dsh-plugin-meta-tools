# Tasks: 协作场景的 spec 编号唯一性

**Input**: `specs/018-spec-number-uniqueness/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: 宪章原则 II 要求测试同步；每个用户故事阶段包含 `tests/worktree-extension.test.ts` 的用例。

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

**Goal**: 工作区就绪，现有扩展测试在改动前通过。

- [ ] T001 在 worktree 根目录运行 `pnpm install`，再运行 `pnpm test:code -- tests/worktree-extension.test.ts` 确认基线通过
- [ ] T002 提交 `specs/018-spec-number-uniqueness/` 的 spec、plan、research、data-model、contracts、quickstart 与 checklist

---

## Phase 2: Foundational - 编号库与测试脚手架

**Goal**: 编号解析与远程分支查询可被两个脚本复用，测试能模拟另一名开发者。

**Independent Test**: `pnpm test:code -- tests/worktree-extension.test.ts` 通过。

- [ ] T003 [P] 新增 `.specify/extensions/worktree/scripts/bash/spec-number-lib.sh`：
  - `feature_number_from_branch BRANCH` 从分支名最后一段取三位以上数字，无匹配时输出空。
  - `remote_branches` 从 stdin 的 `git ls-remote --heads` 输出中去掉 `SHA\trefs/heads/` 前缀。
  - `spec_branches_with_number NUMBER` 从 stdin 的分支名中筛出末段以 `<NUMBER>-` 开头的分支。
  - 文件只定义函数，无副作用；文件头注释说明职责与导出。
- [ ] T004 [P] 在 `tests/worktree-extension.test.ts` 新增测试辅助：
  - `secondClone(base)`：在临时 origin 旁建第二个克隆。
  - `pushBranch(clone, branch)`：在克隆中建分支并推送。
  - `remoteBranches(cwd)`：读取远程分支名列表。
- [ ] T005 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 库函数与测试辅助就绪，现有用例保持通过。

---

## Phase 3: User Story 1 - 创建 spec 时在远程占号 (Priority: P1) 🎯 MVP

**Goal**: 创建流程推送占号分支后才建 worktree；占号失败时不留下 worktree 与分支。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 场景 1 与场景 4 核对。

- [ ] T006 [US1] 修改 `.specify/extensions/worktree/scripts/bash/create-worktree.sh`：
  - 先建本地分支 `git branch --no-track <BRANCH_NAME> <BASE_REF>`，再 `git push origin <BRANCH_NAME>` 占号。
  - 占号失败删除本地分支，退出码 1，stderr 说明推送失败。
  - 占号成功后 `git worktree add <WORKTREE_PATH> <BRANCH_NAME>`；worktree 创建失败时删除远程与本地分支并退出 1。
  - JSON 输出增加 `CLAIMED`：本次占号成功为 `true`，`--dry-run` 与 `IN_WORKTREE` 复用为 `false`。
  - `--dry-run` 不建分支、不推送、不建 worktree。
- [ ] T007 [P] [US1] 在 `tests/worktree-extension.test.ts` 新增用例：
  - 创建成功后 `git ls-remote --heads origin <BRANCH_NAME>` 非空，`CLAIMED=true`。
  - `--dry-run` 不产生远程分支与 worktree，`CLAIMED=false`。
  - 占号失败（`--no-fetch` 且 origin 指向不可达路径）时退出码非 0，`worktrees/` 无新目录，`git branch --list` 无新分支。
- [ ] T008 [P] [US1] 修改 `.specify/extensions/worktree/commands/speckit.worktree.create.md`：
  - 删除「Native worktree tool」分支，创建统一执行 `create-worktree.sh`。
  - 写明执行顺序：同步、算号、占号、建 worktree；占号失败时停止。
  - Output 增加 `CLAIMED`。
  - 把正文同步到 `.dsh/skills/speckit-worktree-create/SKILL.md`，保留 front matter。
- [ ] T009 [US1] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 创建流程结束时远程已有占号分支。

---

## Phase 4: User Story 2 - 同时创建时编号自动收敛 (Priority: P2)

**Goal**: 同号分支按分支名排序保留一个，其余自动改号；交付前再校验一次，冲突时停止。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 场景 3 与场景 5 核对。

- [ ] T010 [US2] 修改 `.specify/extensions/worktree/scripts/bash/create-worktree.sh`：
  - 占号后重新执行 `git ls-remote --heads origin`，用 `spec_branches_with_number` 取同号分支。
  - 本分支名不是按 `LC_ALL=C sort` 排第一的分支时，删除远程占号分支与本地分支，编号按当前远程最大编号加一后重试，最多 10 次。
  - 同号分支已合并进 base 时保留原编号。
  - `git ls-remote` 失败时删除占号并退出 1。
- [ ] T011 [US2] 新增 `.specify/extensions/worktree/scripts/bash/check-spec-number.sh`，按 [contracts/check-spec-number-cli.md](./contracts/check-spec-number-cli.md)：
  - 先 `git fetch --quiet origin <base-ref 的分支>`。
  - 远程同号分支与 base ref 的同号 spec 目录都算冲突。
  - 退出码 0/4/1，`--json` 与 `KEY=VALUE` 两种输出。
- [ ] T012 [P] [US2] 在 `tests/worktree-extension.test.ts` 新增用例：
  - 另一克隆已推送 `fix/002-alpha`，本仓库 `--no-fetch` 创建 `zeta` 时改为 003，远程保留 `fix/002-alpha` 与 `fix/003-zeta`。
  - 本分支字典序靠前时保留原编号。
  - `check-spec-number.sh`：无冲突退出 0 且 `UNIQUE=true`；同号分支冲突退出 4 并列出分支；base ref 含同号 spec 目录时退出 4。
- [ ] T013 [P] [US2] 修改 `.specify/extensions/worktree/commands/speckit.worktree.finish.md`：
  - 在提交之后、推送与 PR 之前新增一步运行 `check-spec-number.sh --json`。
  - 退出 4 时停止并报告冲突引用；退出 1 时停止。
  - 后续步骤重新编号，正文引用同步。
  - 把正文同步到 `.dsh/skills/speckit-worktree-finish/SKILL.md`，保留 front matter。
- [ ] T014 [US2] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 同号冲突在创建时收敛，交付前拦截残留冲突。

---

## Phase 5: User Story 3 - 编号依据包含远程最新状态 (Priority: P3)

**Goal**: 算号前同步远程全部分支，过期引用不再造成重复。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 场景 2 核对。

- [ ] T015 [US3] 修改 `.specify/extensions/worktree/scripts/bash/create-worktree.sh`：
  - 算号前执行 `git fetch --quiet --prune origin` 拉取全部 head。
  - `--no-fetch` 跳过该步，仍占号并校验。
  - base ref 不含远程前缀时跳过该步，沿用现有错误路径。
- [ ] T016 [P] [US3] 在 `tests/worktree-extension.test.ts` 新增用例：
  - 另一克隆推送 `fix/002-other` 后本仓库不 fetch，创建结果编号为 003。
  - `--no-fetch` 时新编号基于本地可见状态，并仍完成占号。
- [ ] T017 [US3] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 别人已推送、本机未 fetch 时编号仍然避让。

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T018 [P] 更新 `docs/development.md`：
  - Spec Kit 流程节写明创建时占号、编号来自远程、交付前校验。
  - 维护 worktree 扩展节补充 `spec-number-lib.sh`、`check-spec-number.sh` 与测试覆盖。
- [ ] T019 [P] 更新 `CHANGELOG.md` 的 `## Unreleased`，记录占号、自动改号与交付前校验。
- [ ] T020 按 [quickstart.md](./quickstart.md) 验证场景 1–5，并记录结果
- [ ] T021 运行 `pnpm format && pnpm full-check`，提交

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 无依赖。
- **Phase 2**: 依赖 Phase 1。
- **Phase 3**: 依赖 Phase 2。
- **Phase 4**: 依赖 Phase 3 的占号输出。
- **Phase 5**: 依赖 Phase 3 的算号入口。
- **Phase 6**: 依赖 Phase 3–5。

### Within Each Phase

- 脚本改动先于用例与文档同步。
- 每个阶段结束运行 `pnpm format && pnpm check` 并提交。

### Parallel Opportunities

- T003 与 T004 文件不同，可并行。
- T007 与 T008 文件不同，可并行。
- T012 与 T013 文件不同，可并行。
- T018 与 T019 文件不同，可并行。

---

## Implementation Strategy

### MVP First

1. 完成 Phase 1–3，占号即可消除主要重复来源。
2. 按 quickstart 场景 1 与 4 单独验证。
3. 继续 Phase 4、5 补齐并发与过期引用。

### Incremental Delivery

- Phase 3：远程可见占号。
- Phase 4：并发收敛与交付前拦截。
- Phase 5：过期引用避让。
- Phase 6：文档、CHANGELOG 与场景验证。
