# Implementation Plan: 同步模板热更新实机流程与前端链接规则

**Branch**: `docs/025-template-sync` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-template-sync/spec.md`

**Status**: Waived

## Open Decisions

无未决项。实现决策见 Clarifications。

## Clarifications

### Session 2026-11-20

用户放弃访谈，要求只加热更新能力，前端文档一并修改。实现决策按仓库既有做法确定：

- [P-D-001] Q: 脚本改动如何适配本项目？ -> A: 直接采用模板 `fe93cd0` 的实现，路径与包名来自现有脚本变量，不改动其余逻辑。
- [P-D-002] Q: 热更新验证写哪一步？ -> A: `SKILL.md` 迭代小节改配置页文案（`src/client/locales.ts`），构建后在已打开的配置页观察，验证后还原临时改动。
- [P-D-003] Q: 是否新增自动测试？ -> A: 不新增。交付物是 skill 脚本与文档；质量门禁为 `pnpm check` 与最小实机验证。

## Review Record

- 2026-11-20 | Decision: Waived | Scope: current full document | Open items: P-D-001 到 P-D-003 | Risks: 模板遗留用例未适配；最小实机验证不覆盖浏览器全量用例

## Summary

迁移模板最近两个 commit 中与本项目相关的内容：

- 实机测试 skill（`fe93cd0`）：profile 改为链接安装，启用 HMR 监听仓库 `dist`，补丁缺 `hmr` 时补齐；新增「构建后同一实例生效」的迭代说明、热更新验证步骤与排错表；每轮结束删除 profile；A1 文案改为「加载的版本/产物」。
- 开发文档（`197480e`）：`docs/development.md` 在「前端构建」后新增「前端 UI 链接」，要求 `a` 标签使用完整 URL。
- 记录：`CHANGELOG.md` 补两条 `Unreleased` 条目。

模板的 spec 产物不复制；skill 中模板遗留的 `demo_echo` 用例不在本次范围。

## Technical Context

**Language/Version**: Markdown；Bash；Node.js ESM（实机驱动脚本）

**Primary Dependencies**: DSH `0.2.2-rc.3`（本机 `~/.dsh-local/dsh-0.2.2-rc.3` 已有）；`playwright`；本机 Chrome

**Storage**: profile 目录下的 `cordis.patch.yml`、`results.json` 与截图；仓库 `dist/`

**Testing**: `pnpm check`；`bash -n`；最小实机验证（链接安装、补丁内容、构建后配置页文案）

**Target Platform**: DSH Web GUI；Windows + Git Bash

**Project Type**: DSH 插件与实机测试 skill 仓库

**Performance Goals**: 不适用；热更新在数秒内生效

**Constraints**: 不改插件源码、产物与测试；不新增自动化测试；不复制模板 spec；示例 URL 用本项目仓库地址

**Scale/Scope**: 修改 5 个 skill 文件、1 份开发文档、1 份变更记录，新增 025 规格产物

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不改 `package.json`，宿主版本仍为 `0.2.2-rc.3` |
| II 测试同步 | 通过 | 插件代码与产物不变，不新增 `tests/`；按 SHOULD 做最小实机验证 |
| III 文档结构 | 通过 | 实机流程归 `.dsh/skills/real-device-test`，开发规则归 `docs/development.md`，变更记录归 `CHANGELOG.md` |
| IV 质量门禁 | 通过 | 合并门禁 `pnpm full-check`，本需求至少运行 `pnpm check` |
| V 公开引用 | 通过 | 文档引用仓库相对路径；示例链接为公开仓库地址 |

**GATE 结论**: 通过。

## Project Structure

### Documentation (this feature)

```text
specs/025-template-sync/
├── checklists/requirements.md
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
.dsh/skills/real-device-test/
├── SKILL.md                       # 链接安装、HMR、迭代小节、清理顺序
├── references/cases.md            # 热更新验证步骤与报告小节
├── references/pitfalls.md         # 热更新排错表
└── scripts/
    ├── setup-env.sh               # 链接安装、hmr 补丁、结尾提示
    └── run-test.mjs               # A1 文案
docs/development.md                # 前端 UI 链接小节
CHANGELOG.md                       # Unreleased 条目
```

**Structure Decision**: 实机流程留在既有 skill 目录，不新增脚本；文档规则放在 `docs/development.md` 的前端章节，与「前端构建」相邻。

## Complexity Tracking

无偏离。
