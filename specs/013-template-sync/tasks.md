# Tasks: 对齐模板的元数据国际化与产物新鲜度门禁

**Input**: Design documents from `/specs/013-template-sync/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 宪章原则 IV 要求代码变更同步测试；元数据与产物门禁本身就是测试，因此每个阶段都包含测试任务。

**Organization**: 按用户故事分阶段；每个阶段结束提交一次。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事
- 每个任务给出确切文件路径

## Phase 1: 元数据资源校验（US1、US2）

**Goal**: 元数据资源的结构、键集与清单声明由测试覆盖，发布包内容由打包测试回归。

**Independent Test**: 删除任一 `meta.title` 或 `files` 中的 `locale/*.json`，`pnpm test:code` 失败并指出文件；恢复后通过。

- [X] T001 [P] [US1] 新增 `tests/metadata.test.ts`：目录只含基线语言文件；`meta` 键集为 `title`、`description`；两者非空；标题不含换行；`meta.detail` 存在时匹配 `docs/*.md` 且文件存在；资源不含 U+200B 与 U+FEFF；`package.json` 的 `exports['./locale/*.json']` 与 `files` 含 `locale/*.json`；失败信息带文件路径
- [X] T002 [P] [US2] 更新 `tests/package-pack.test.ts` 顶部注释与断言：tarball 进包含 `dist`、`cordis.patch.yml`、`locale/en.json`、`locale/zh.json`、`icon.svg`、`README.md`，不含 `src/`、`tests/`、`scripts/`
- [X] T003 [US2] 运行 `pnpm test:code`，确认 T001 与 T002 通过；`locale/en.json` 与 `locale/zh.json` 缺字段时补齐（当前两份资源已含 `meta.title` 与 `meta.description`）
- [X] T004 本阶段提交：`test(013): 校验插件元数据与打包声明`

---

## Phase 2: 产物新鲜度（US3）

**Goal**: 产物测试只在新鲜产物上运行；`check` 不读取 `dist`，`build` 末尾运行 `test:dist`。

**Independent Test**: 删除 `dist/` 后 `pnpm test:dist` 失败并提示 `pnpm build`，`pnpm check` 通过；`pnpm build` 后 `pnpm test:dist` 通过。

- [X] T005 [P] [US3] 新增 `tests/support/dist-freshness.ts`：导出 `assertFreshDist(root?)`；`BUILD_INPUT_FILES` 为 `tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`；`BUILD_INPUT_DIRS` 为 `src`；`BUILD_PRODUCTS` 为 `dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts`；缺失或输入晚于最旧产物时抛错，错误含缺失与过期文件清单及 `pnpm build`
- [X] T006 [US3] 新增 `tests/dist-freshness.test.ts`：在 `mkdtempSync` 临时目录构造输入与产物，覆盖新鲜、输入晚于产物、产物全缺、缺任一产物四种状态，`afterEach` 清理临时目录
- [X] T007 [US3] 修改 `tests/client-bundle.test.ts`：删除 `ensureBuild` 与 `spawnSync`、`existsSync` 导入，读取产物前调用 `assertFreshDist()`
- [X] T008 [US3] 修改 `tests/package-pack.test.ts`：删除条件构建分支与 `existsSync` 导入，`packedPaths()` 开头调用 `assertFreshDist()`，保留 `npm pack --dry-run --json` 缓存
- [X] T009 [US3] 修改 `vitest.config.ts`：在 `test` 下增加 `projects`，定义 `code`（`tests/**/*.test.ts`、`tests/**/*.test.mjs`，排除产物测试、`worktrees/**`、`node_modules/**`）与 `dist`（只含 `tests/client-bundle.test.ts`、`tests/package-pack.test.ts`），两者 `extends: true`
- [X] T010 [US3] 修改 `package.json` 的 `scripts`：`build` 追加 `pnpm run test:dist`；`check` 改用 `test:code`；新增 `test:code`、`test:dist`；移除 `test`
- [X] T011 [US3] 修改 `.github/workflows/ci.yml`：`check` job 的 `name` 改为 `Check (typecheck + lint + test:code + build + test:dist)`
- [X] T012 [US3] 运行 `pnpm build` 与 `pnpm check`，确认 `build` 末尾的 `test:dist` 通过、删除 `dist` 后 `check` 仍通过
- [X] T013 本阶段提交：`fix(013): 拆分源码测试与产物测试`

---

## Phase 3: 文档与宪章（US4）

**Goal**: 国际化规范与测试命令各有单一归属，宪章与脚本、测试一致。

**Independent Test**: 从 `AGENTS.md` 索引进入 `docs/i18n.md` 能列出新增语言要改的全部文件；`docs/development.md` 命令表含 `test:code` 与 `test:dist`。

- [X] T014 [P] [US4] 新增 `docs/i18n.md`：元数据资源位置与字段、宿主读取与回退、包清单声明、前端字典、语言选择、新增语言步骤与校验命令；按本插件改写文件名与命名空间
- [X] T015 [US4] 修订 `.specify/memory/constitution.md`：原则 IV 进包清单补 `locale/*.json` 与 `icon.svg`；原则 VI 合并门禁改为 `pnpm full-check`；原则 IX 增加元数据资源、键集一致、清单声明、禁用字符与规范归属条款；版本 1.10.0 → 1.11.0，更新 Sync Impact Report 与 `Last Amended`
- [X] T016 [P] [US4] 修订 `AGENTS.md`：新增项目说明小节（技术栈与常用脚本，含 `test:code`、`test:dist`）；文档索引增加 `README.md` 与 `docs/i18n.md`；写作规范移到末尾
- [X] T017 [P] [US4] 修订 `README.md`：功能列表增加「插件页标题与描述随宿主语言切换，中英文各一份」
- [X] T018 [US4] 修订 `docs/development.md`：命令表更新 `build`、`check` 并增加 `test:code`、`test:dist`；新增 CI 小节说明 `full-check` 与产物测试时机；测试文件表增加 `tests/metadata.test.ts`、`tests/dist-freshness.test.ts`，标注两份产物测试；补 vitest 双 project 说明与 `docs/i18n.md` 链接；文件地图补 `locale/` 与 `tests/support/`
- [X] T019 [P] [US4] 修订 `docs/how-it-works.md`：字典小节增加 `docs/i18n.md` 链接；打包与发布小节补 `locale/*.json` 与元数据读取
- [X] T020 [P] [US4] 修订 `docs/known-risks.md`：新增国际化小节，写明注册时捕获的文案、回退顺序与元数据缺失的回落
- [X] T021 [US4] 修订 `CHANGELOG.md`：Unreleased 记录元数据测试与文档、测试脚本拆分、产物过期提示、宪章修订
- [X] T022 [US4] 运行 `pnpm format && pnpm check`，确认类型、lint 与源码测试通过
- [X] T023 本阶段提交：`docs(013): 记录国际化规范与测试命令`

---

## Phase 4: 实机核对与收尾

**Goal**: 在真实宿主上验证中英文切换与停用状态，并完成发布内容核对。

- [X] T024 按 `real-device-test` skill 启动宿主，在中英文下核对插件行标题与描述，停用后再核对一次
- [X] T025 写入 `specs/013-template-sync/rdt-report.md`：宿主版本、核对步骤、中英文与停用状态的截图或文本、结论
- [X] T026 运行 `pnpm format && pnpm full-check` 与 `npm pack --dry-run --json`，核对进包表与 `contracts/package-manifest.md` 一致
- [X] T027 本阶段提交：`test(013): 实机核对与发布内容检查`

---

## Dependencies

- Phase 1（US1、US2）不依赖其他阶段。
- Phase 2（US3）不依赖 Phase 1；T006、T007、T008 依赖 T005 的 `assertFreshDist`。
- Phase 3（US4）文档引用 Phase 1、Phase 2 的产物（测试文件名、脚本名），建议在两者完成后执行。
- Phase 4 依赖 Phase 1 至 Phase 3 全部完成。

```text
T005 → {T006, T007, T008}
T009 → T010（脚本引用 project 名称）
T014 → T016 → T022
T024 → T025 → T026 → T027
```

## Parallel Execution

- Phase 1：T001 与 T002 可并行。
- Phase 2：T005 先行；T006、T007、T008 可并行；T009、T010、T011 可并行。
- Phase 3：T014、T016、T017、T019、T020 可并行；T015、T018、T021 串行完成后再运行 T022。

## Implementation Strategy

先完成 Phase 1 与 Phase 2，使门禁本身可用；再用 Phase 3 把规范与命令写进文档与宪章；最后实机核对并提交收尾。MVP 为 Phase 1：元数据测试让语言切换的资源问题在提交前暴露。