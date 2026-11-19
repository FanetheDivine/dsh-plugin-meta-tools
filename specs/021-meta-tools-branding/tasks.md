---
description: "Task list for meta tools branding and user-facing docs"
---

# Tasks: 元工具品牌与面向用户的说明

**Input**: Design documents from `specs/021-meta-tools-branding/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/config-page.md、quickstart.md

**Tests**: 元数据与配置页文案有测试覆盖，先改测试再改实现。

**Organization**: 按用户故事组织，每个阶段对应一个 commit。

## Phase 1: Setup

**Purpose**: 提交 spec 产物。

- [X] T001 提交 `specs/021-meta-tools-branding/` 下的 spec、plan、research、data-model、contracts、quickstart、checklists 与 tasks

---

## Phase 2: User Story 1 - 在插件列表一眼认出元工具 (Priority: P1) 🎯 MVP

**Goal**: 标题、描述与图标突出元工具定位。

**Independent Test**: `pnpm test:code` 中元数据测试断言新标题与描述；在“插件”页查看行与卡片。

- [X] T002 [US1] 更新 `tests/metadata.test.ts` 的“标题与描述按用户文案”断言为 research.md 中的新标题与描述
- [X] T003 [P] [US1] 更新 `locale/zh.json` 与 `locale/en.json`：标题“元工具”与“Meta tools”，描述取自 research.md
- [X] T004 [P] [US1] 重绘 `icon.svg`：`width="36" height="36" viewBox="0 0 36 36"`，扳手加约 300° 首尾相接的圆弧箭头，单色 `#5b7cfa` 描边，无底板、无文字，保留 `<title>dsh-plugin-meta-tools</title>`

**Checkpoint**: `pnpm format && pnpm check` 通过。

---

## Phase 3: User Story 2 - 在详情页读懂能力与风险 (Priority: P1)

**Goal**: README 面向用户；开发者信息有唯一归属。

**Independent Test**: 通读 `README.md`，确认没有安装命令、配置键表与工具参数表；`docs/` 中能找到被移出的信息。

- [X] T005 [US2] 把工具一览、配置键与会话日志目录结构迁入 `docs/how-it-works.md`，作为“工具一览”“配置键”“会话日志目录”小节
- [X] T006 [P] [US2] 把安装命令与同名工具冲突提示迁入 `docs/development.md` 的“安装”小节
- [X] T007 [US2] 重写 `README.md`：元工具定义、适用场景、AI 能做什么（按三组）、如何限制、安全边界、限制、开发链接
- [X] T008 [P] [US2] 修订 `.specify/memory/constitution.md` 原则 III 表格中 README 的归属内容为“元工具定位、使用场景、能力、限制”，版本 2.0.1，更新 Sync Impact Report
- [X] T009 [P] [US2] 在 `AGENTS.md` 文档索引中同步 README 的说明

**Checkpoint**: `pnpm format && pnpm check` 通过。

---

## Phase 4: User Story 3 - 在配置页按能力决定开放范围 (Priority: P2)

**Goal**: 配置页三组开关，每项标签加说明。

**Independent Test**: 配置页测试断言三个分组标题、十一行标签与说明、开关无障碍名称。

- [X] T010 [US3] 更新 `tests/client.test.ts`：分组键与顺序覆盖 `TOOL_NAMES`；`config.<tool>.description` 中英齐全；page 渲染三个 `data-dsh-meta-tools-group`、十一段说明；标签按 contracts/config-page.md；summary 新文案
- [X] T011 [US3] 在 `src/constants.ts` 增加 `TOOL_GROUPS`：`workspace`、`sessionRead`、`sessionManage` 三组，组内顺序与 `TOOL_NAMES` 一致
- [X] T012 [US3] 在 `src/client/locales.ts` 增加分组标题与 `config.<tool>.description`，按 contracts/config-page.md 修改标签与 `config.summary`
- [X] T013 [US3] 在 `src/client/config-page.tsx` 按 `TOOL_GROUPS` 渲染分组标题与行；每行左侧标签与说明，右侧 `Switch`；行间使用 `--dsw-alias-border-l2` 分隔线
- [X] T014 [US3] 在 `docs/i18n.md` 与 `docs/how-it-works.md` 的前端小节写明分组与说明键

**Checkpoint**: `pnpm format && pnpm check` 通过。

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T015 在 `CHANGELOG.md` 的 Unreleased 增加本次变更
- [X] T016 运行 `pnpm format && pnpm full-check`
- [X] T017 按 quickstart.md 在宿主“插件”页核对标题、描述、图标、详情页与配置页，覆盖中英文、明暗主题与 390 px

## Dependencies

- Phase 1 先行。
- Phase 2、3、4 相互独立，可按顺序逐个提交。
- Phase 5 依赖前四个阶段。

## Parallel Example

- Phase 2：T003 与 T004 可并行。
- Phase 3：T006、T008、T009 可与 T005 并行。

## Implementation Strategy

先完成 Phase 2 作为 MVP，用户在插件列表即可看到新定位；再完成 README 与配置页。
