# Implementation Plan: 模板文档同步

**Branch**: `docs/015-template-docs-sync` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-template-docs-sync/spec.md`

## Summary

- 宪章只保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则，版本升到 `2.0.0`。
- 宿主契约、依赖归属、严格配置与工具契约归入 `docs/how-it-works.md`，国际化约束归入 `docs/i18n.md`。
- `AGENTS.md` 增加主工作区约束。
- 现行文档、worktree 扩展命令与对应 skill 更新原则编号引用。
- 本次不修改依赖、脚本、测试与工具行为。

## Technical Context

**Language/Version**: Markdown、YAML；现有 Node.js 24.9+ 工具链

**Primary Dependencies**: 无新增依赖

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`，文档检索与 `git diff --check`

**Target Platform**: 仓库文档与 Spec Kit 流程

**Project Type**: DSH 插件文档维护

**Performance Goals**: N/A

**Constraints**: 宪章修订经 `/speckit-constitution`；历史 `specs/` 与已有 CHANGELOG 条目保持原样

**Scale/Scope**: 宪章、`AGENTS.md`、4 份 `docs/`、2 份 worktree 流程文档、CHANGELOG 与本特性产物

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按现行宪章 1.11.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不改入口导出、服务注入与依赖版本，规则迁入 how-it-works |
| II 依赖归属 | 通过 | 无新增依赖，规则迁入 how-it-works |
| III 严格配置 | 通过 | 不改配置代码，规则迁入 how-it-works |
| IV 测试同步 | 通过 | 无代码变更；运行现有质量门禁 |
| V 文档结构 | 通过 | 每条迁出规则只有一个归属文档；主工作区约束归 `AGENTS.md` |
| VI 质量门禁 | 通过 | 每个实施阶段运行 `pnpm format && pnpm check` |
| VII 工具契约 | 通过 | 不改工具行为；当前十一个工具的契约要求迁入 how-it-works |
| VIII 公开引用 | 通过 | 只引用仓库内路径与提交哈希 |
| IX 界面文案与本地化 | 通过 | 不改界面文案与元数据，约束迁入 i18n |
| Governance | 通过 | 经 `/speckit-constitution` 删除并重排原则，按 MAJOR 升到 2.0.0 |

Phase 1 设计后复核：迁移表见 [data-model.md](./data-model.md)，验证步骤见 [quickstart.md](./quickstart.md)，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/015-template-docs-sync/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

本次无外部接口，不生成 `contracts/`。

### Source Code (repository root)

```text
.specify/memory/constitution.md
.specify/extensions/worktree/commands/speckit.worktree.finish.md
.dsh/skills/speckit-worktree-finish/SKILL.md
AGENTS.md
CHANGELOG.md
docs/
├── development.md
├── how-it-works.md
├── i18n.md
└── known-risks.md
```

**Structure Decision**: 规则迁移按 [research.md](./research.md) R2，编号引用按 R4，主工作区文档范围按 R3。

## Complexity Tracking

无偏离。
