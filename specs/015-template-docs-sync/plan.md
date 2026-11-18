# Implementation Plan: 模板流程同步

**Branch**: `docs/015-template-docs-sync` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-template-docs-sync/spec.md`

## Summary

- 宪章只保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则，版本为 `2.0.0`。
- 宿主契约、依赖归属、严格配置与工具契约归入 `docs/how-it-works.md`，国际化约束归入 `docs/i18n.md`。
- `AGENTS.md` 规定主工作区位于 `main` 且干净，所有变更在 worktree 中进行。
- worktree 扩展使用 `sync-main.sh` 检查主工作区，并以 fast-forward 方式同步 `main` 到 `origin/main`。
- `/speckit-worktree-create` 在创建前同步，`/speckit-worktree-finish` 在交付与放弃两种模式的清理后同步。
- `tests/sync-main.test.ts` 覆盖同步、拒绝与脚本自更新场景。

## Technical Context

**Language/Version**: Markdown、YAML、Bash；TypeScript 测试，Node.js 24.9+

**Primary Dependencies**: git、vitest；无新增依赖

**Storage**: N/A

**Testing**: vitest `code` project，`pnpm format && pnpm full-check`，`git diff --check`

**Target Platform**: Spec Kit 流程，Git for Windows bash、Linux、macOS

**Project Type**: DSH 插件流程维护

**Performance Goals**: N/A

**Constraints**: 主工作区只运行 `git fetch` 与 `git pull`；同步只做 fast-forward；历史 `specs/` 与已有 CHANGELOG 条目保持原样

**Scale/Scope**: 宪章、`AGENTS.md`、4 份 `docs/`、2 组 worktree 命令与 skill、1 个同步脚本、1 个回归测试、CHANGELOG 与本特性产物

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按宪章 2.0.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不修改依赖与版本 |
| II 测试同步 | 通过 | 新增 `tests/sync-main.test.ts` 覆盖脚本真实行为；无 `dsh` 版本变更 |
| III 文档结构 | 通过 | 主工作区约束归 `AGENTS.md`，执行步骤归扩展命令，开发文档记录流程产出 |
| IV 质量门禁 | 通过 | 每个实施阶段运行 `pnpm format && pnpm check`，交付前运行 `pnpm full-check` |
| V 公开引用 | 通过 | 只引用仓库内路径与提交哈希 |
| Governance | 通过 | 宪章修订已经 `/speckit-constitution` 完成，本阶段不再修改宪章 |

Phase 1 设计后复核：脚本接口见 [contracts/sync-main.md](./contracts/sync-main.md)，迁移表见 [data-model.md](./data-model.md)，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/015-template-docs-sync/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/sync-main.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.specify/memory/constitution.md
.specify/extensions/worktree/
├── commands/speckit.worktree.create.md
├── commands/speckit.worktree.finish.md
└── scripts/bash/sync-main.sh
.dsh/skills/speckit-worktree-create/SKILL.md
.dsh/skills/speckit-worktree-finish/SKILL.md
AGENTS.md
CHANGELOG.md
docs/
├── development.md
├── how-it-works.md
├── i18n.md
└── known-risks.md
tests/sync-main.test.ts
```

**Structure Decision**: 同步逻辑放进独立脚本，由两份扩展命令在各自步骤调用。规则迁移按 [research.md](./research.md) R2，脚本形态按 R3。

## Complexity Tracking

无偏离。
