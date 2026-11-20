# Tasks: 同步模板热更新实机流程与前端链接规则

**Input**: `specs/025-template-sync/` 下的 plan.md、spec.md、research.md、data-model.md、quickstart.md

**Prerequisites**: 规格与计划均为 `Waived`，无未决项。

**Tests**: 不新增自动测试。质量门禁为 `pnpm check` 与 quickstart.md 的最小实机验证。

**Organization**: 按用户故事分阶段，每个阶段对应一个 commit。

## Format

- `[P]`：可并行，与其他任务不改同一文件
- `[USn]`：对应用户故事

## Phase 1: 实机搭建脚本（US1）

**Goal**: profile 以链接方式加载仓库产物，补丁含 `hmr` 条目。

**Independent Test**: 运行 `setup-env.sh`，`node_modules/<插件>` 指向仓库，补丁含 `- id: hmr` 与 `config.root`。

- [x] T001 [US1] 在 `.dsh/skills/real-device-test/scripts/setup-env.sh` 第 4 步删除 `pnpm pack` 与 tgz 安装，改为 `dsh plugin --profile "$PROFILE" add "$REPO"`，更新步骤标题与注释
- [x] T002 [US1] 在 `.dsh/skills/real-device-test/scripts/setup-env.sh` 新建补丁分支加入 `- id: hmr` 与 `config.root: ["$REPO/dist"]`
- [x] T003 [US1] 在 `.dsh/skills/real-device-test/scripts/setup-env.sh` 复用补丁分支补齐 `hmr`，先删除孤立的 `[]` 占位行
- [x] T004 [P] [US1] 在 `.dsh/skills/real-device-test/scripts/setup-env.sh` 结尾提示写明构建后自动生效与删除 profile
- [x] T005 [US1] 运行 `bash -n .dsh/skills/real-device-test/scripts/setup-env.sh` 校验语法
- [x] T006 [US1] 阶段 1 提交：脚本改动与 `specs/025-template-sync/` 产物

## Phase 2: 迭代说明与排错（US1、US2）

**Goal**: skill 写明「改代码 → 构建 → 同一实例生效」，排错表覆盖常见失败。

**Independent Test**: 只读 skill 能复现迭代步骤；逐条查排错表能找到原因与处理。

- [x] T007 [US1] 在 `.dsh/skills/real-device-test/SKILL.md` 阶段 0 说明构建是迭代动作，阶段 1 说明链接安装与 HMR 监听 `dist`
- [x] T008 [US1] 在 `.dsh/skills/real-device-test/SKILL.md` 新增迭代小节：构建命令、同一实例生效、配置热更新的适用范围、改 `src/client/locales.ts` 文案的验证步骤与还原要求
- [x] T009 [P] [US2] 在 `.dsh/skills/real-device-test/references/cases.md` 增加热更新验证步骤与报告结构中的「热更新验证」一节
- [x] T010 [P] [US2] 在 `.dsh/skills/real-device-test/references/pitfalls.md` 增加热更新排错表六类现象
- [x] T011 [US1] 阶段 2 提交：skill 与参考文档

## Phase 3: 装载文案与清理（US4）

**Goal**: A1 文案与链接安装一致，收尾删除 profile。

**Independent Test**: 读取 `run-test.mjs` 的 A1 文案指向加载产物；按 skill 收尾后 profile 不存在。

- [x] T012 [P] [US4] 在 `.dsh/skills/real-device-test/scripts/run-test.mjs` 把 A1 的两处「已安装」改为「加载的版本」与「加载产物」
- [x] T013 [US4] 在 `.dsh/skills/real-device-test/SKILL.md` 阶段 5 改为先写报告与保存截图、再结束 GUI、最后 `rm -rf` profile
- [x] T014 [US4] 阶段 3 提交：驱动文案与清理顺序

## Phase 4: 前端链接文档（US3）

**Goal**: 开发文档写明前端 `a` 标签使用完整 URL。

**Independent Test**: 打开 `docs/development.md`，「前端构建」之后能读到要求、示例与原因。

- [x] T015 [P] [US3] 在 `docs/development.md` 的「前端构建」之后新增「前端 UI 链接」小节，示例用 `https://github.com/FanetheDivine/dsh-plugin-meta-tools`
- [x] T016 [US3] 阶段 4 提交：开发文档

## Phase 5: 记录与验证（Polish）

**Goal**: 变更可查，门禁与最小实机验证通过。

**Independent Test**: `pnpm check` 通过；quickstart 的搭建与热更新观察通过。

- [x] T017 在 `CHANGELOG.md` 的 `Unreleased`/`Changed` 新增实机热更新与前端 UI 链接两条
- [x] T018 运行 `pnpm check`
- [x] T019 按 `specs/025-template-sync/quickstart.md` 做最小实机验证：链接安装、补丁 `hmr`、构建后配置页文案更新、进程号不变
- [x] T020 阶段 5 提交：CHANGELOG 与验证结论

## Dependencies & Execution Order

- 阶段 2 依赖阶段 1：skill 说明以链接安装与 HMR 为前提。
- 阶段 3 依赖阶段 1：A1 文案对应链接安装后的加载源。
- 阶段 4 与阶段 1–3 互不依赖，可并行。
- 阶段 5 依赖前四个阶段。

### Within Each Phase

- 阶段 1 的 T001–T004 改同一文件，按顺序执行；T004 与 T001–T003 不并行。
- 阶段 2 的 T009、T010 改不同文件，可并行。
- 阶段 3 的 T012 与 T013 改不同文件，可并行。

## Parallel Example

```text
T009、T010 可同时进行（cases.md、pitfalls.md）
T012、T013 可同时进行（run-test.mjs、SKILL.md）
阶段 4（T015）可与阶段 2、3 同时进行
```

## Implementation Strategy

先完成阶段 1 的脚本改动并做一次搭建验证，再补 skill 说明与排错；阶段 4 的文档改动独立提交；最后记录变更并跑门禁与实机验证。
