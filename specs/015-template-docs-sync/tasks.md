# Tasks: 模板流程同步

**Input**: `specs/015-template-docs-sync/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: 每个实施阶段运行 `pnpm format && pnpm check`；`tests/sync-main.test.ts` 覆盖同步脚本真实行为；最终执行 `pnpm full-check` 与 quickstart 验证。

**Organization**: 按用户故事分组；每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 确认 `pnpm check` 基线通过，提交 `specs/015-template-docs-sync/`

---

## Phase 2: User Story 1 - Constitution Check 只核对硬约束 (Priority: P1) 🎯 MVP

**Goal**: 宪章 `2.0.0` 只含五条跨需求硬约束。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 文档验证第 1 步核对原则列表与版本。

- [X] T002 [US1] 经 `/speckit-constitution` 重写 `.specify/memory/constitution.md`：原则依次为 I 宿主依赖版本、II 测试同步（不可协商）、III 文档结构、IV 质量门禁、V 公开引用；原则 II–V 保留原原则 IV、V、VI、VIII 的条款；原则 I 写明同版本 `@deepseek-ai/dsh`、同一确切 `dsh-*` 版本与 `minimumReleaseAgeExclude`；Governance 保持现状；更新 Sync Impact Report、版本与日期
- [X] T003 [US1] 运行 `pnpm format && pnpm check`，提交 `.specify/memory/constitution.md`

**Checkpoint**: 宪章 `2.0.0` 生效，其他文档的编号引用在 Phase 3 同步。

---

## Phase 3: User Story 2 - 移出的规则仍能在归属文档中查到 (Priority: P1)

**Goal**: 迁出规则各有唯一归属，现行编号引用指向正确原则。

**Independent Test**: 按 [data-model.md](./data-model.md) 逐行核对，执行 [quickstart.md](./quickstart.md) 文档验证第 2、4、5 步。

- [X] T004 [P] [US2] 修改 `docs/how-it-works.md`：在「入口契约」补全四个导出、`.volatile()`、必需与可选服务、type-only 导入；在「配置解析」写明解析顺序、默认值、严格校验与冻结；新增「依赖复用」写明两类依赖与打包回归；新增「工具契约」写明当前十一个工具、`tests/contract.test.ts` 回归、同名开关、兼容性说明与用户确认
- [X] T005 [P] [US2] 修改 `docs/i18n.md`：新增「约束」节，写入原原则 IX 的全部规则，工具契约文案链接到 `docs/how-it-works.md#工具契约`，删除首行旧原则编号引用
- [X] T006 [P] [US2] 修改 `docs/development.md`：测试要求改引宪章原则 II，Spec Kit 流程说明保持当前扩展行为
- [X] T007 [P] [US2] 修改 `docs/known-risks.md`：宿主版本链接宪章原则 I，共享宿主实例风险链接 `docs/how-it-works.md#依赖复用`
- [X] T008 [P] [US2] 修改 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 与 `.dsh/skills/speckit-worktree-finish/SKILL.md`：CHANGELOG 规则改引原则 III，保持两份正文一致
- [X] T009 [US2] 运行 `pnpm format && pnpm check`，提交本阶段全部文档

---

## Phase 4: User Story 3 - 主工作区只用于同步 (Priority: P1)

**Goal**: Agent 从 `AGENTS.md` 得知主工作区约束。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 文档验证第 3 步核对四条规则，宪章仍为五条原则。

- [X] T010 [US3] 修改 `AGENTS.md`：在「文档索引」与「开发流程」之间新增「主工作区」，写明 `main` 分支、`git status --porcelain` 为空、只运行 `git fetch` 与 `git pull`、任何变更在 worktree 中进行
- [X] T011 [US3] 运行 `pnpm format && pnpm check`，提交 `AGENTS.md`

---

## Phase 5: Polish

- [X] T012 按 `specs/015-template-docs-sync/quickstart.md` 完成全部验证，检查 `git diff --check` 与当前原则编号引用
- [X] T013 修改 `CHANGELOG.md`，记录宪章 `2.0.0`、规则归属与主工作区约束
- [X] T014 勾选 `specs/015-template-docs-sync/tasks.md` 的完成任务，运行 `pnpm format && pnpm full-check`，提交本阶段文件

---

## Phase 6: Foundational - 主工作区同步脚本

**Goal**: `sync-main.sh` 按 [contracts/sync-main.md](./contracts/sync-main.md) 工作，供 US4 与 US5 调用。

**Independent Test**: `pnpm vitest run tests/sync-main.test.ts` 通过 9 个同步与拒绝场景。

- [X] T015 新增 `tests/sync-main.test.ts`，在临时仓库与 bare origin 中覆盖 quickstart 自动验证表的 9 个场景；先运行并确认脚本缺失时失败
- [X] T016 新增 `.specify/extensions/worktree/scripts/bash/sync-main.sh`：定位首个 worktree，检查 `main` 与清洁状态，fetch 后检查祖先关系，以 `git pull --ff-only` 同步；按契约输出字段与退出码；逻辑包在函数中，最后一行为 `main "$@"; exit $?`
- [X] T017 运行 `pnpm vitest run tests/sync-main.test.ts` 与 `pnpm format && pnpm check`，提交本阶段脚本、测试与 Spec Kit 产物

---

## Phase 7: User Story 4 - 开始前主工作区 main 与 origin 一致 (Priority: P1)

**Goal**: `/speckit-worktree-create` 在创建 worktree 前同步主工作区。

**Independent Test**: 命令与 skill 都在创建前调用同步脚本，失败时停止；脚本回归测试通过。

- [X] T018 [US4] 修改 `.specify/extensions/worktree/commands/speckit.worktree.create.md` 与 `.dsh/skills/speckit-worktree-create/SKILL.md`：创建前运行 `sync-main.sh --json`，退出 2 或 1 时停止并报告，复用 worktree 时也执行；Output 增加 `MAIN_COMMIT` 与 `UPDATED`；保持两份正文一致
- [X] T019 [US4] 运行 `pnpm vitest run tests/sync-main.test.ts` 与 `pnpm format && pnpm check`，提交开始流程文件

---

## Phase 8: User Story 5 - 结束后主工作区 main 与 origin 一致 (Priority: P1)

**Goal**: `/speckit-worktree-finish` 在交付与放弃两种模式的清理后同步主工作区。

**Independent Test**: 命令与 skill 都在清理后调用同步脚本，失败时报告并保留主工作区现状；脚本回归测试通过。

- [ ] T020 [US5] 修改 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 与 `.dsh/skills/speckit-worktree-finish/SKILL.md`：`finish-worktree.sh` 成功后运行 `sync-main.sh --json`，退出 2 或 1 时报告原因；Output 增加同步结果；保持两份正文一致
- [ ] T021 [US5] 运行 `pnpm vitest run tests/sync-main.test.ts` 与 `pnpm format && pnpm check`，提交结束流程文件

---

## Phase 9: Polish

- [ ] T022 修改 `docs/development.md`：测试表加入 `tests/sync-main.test.ts`，流程表第 1、7 步加入主工作区同步，维护 worktree 扩展节加入新测试
- [ ] T023 修改 `CHANGELOG.md`，记录开始与结束流程的主工作区同步及回归测试
- [ ] T024 按 `specs/015-template-docs-sync/quickstart.md` 完成验证，勾选 `specs/015-template-docs-sync/tasks.md`，运行 `git diff --check` 与 `pnpm format && pnpm full-check`，提交本阶段文件

---

## Dependencies

- Phase 1 → Phase 2 → Phase 3。
- Phase 4 只依赖 Phase 1，可与 Phase 2、3 并行；本次按阶段顺序执行。
- Phase 3 的 T004–T008 修改不同文件，可并行。
- Phase 5 依赖 Phase 1–4，记录文档阶段核对结果。
- Phase 6 依赖 Phase 5，提供 US4 与 US5 共用的同步脚本。
- Phase 7 与 Phase 8 都依赖 Phase 6，两者修改不同文件，可并行；本次顺序执行。
- Phase 9 依赖全部用户故事完成。

## Parallel Example: User Story 2

```text
T004: docs/how-it-works.md
T005: docs/i18n.md
T006: docs/development.md
T007: docs/known-risks.md
T008: worktree finish 命令与 skill
```

## Implementation Strategy

- MVP：Phase 1 + Phase 2，宪章 `2.0.0` 生效。
- 文档阶段按 Phase 3 → Phase 4 → Phase 5 交付。
- 同步阶段按 Phase 6 → Phase 7 → Phase 8 → Phase 9 交付，每个阶段一个 commit。
- 总任务 24 项：US1 2 项、US2 6 项、US3 2 项、US4 2 项、US5 2 项、Setup 1 项、Foundational 3 项、Polish 6 项。
