# Implementation Plan: 对齐模板的元数据国际化与产物新鲜度门禁

**Branch**: `feat/013-template-sync` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-template-sync/spec.md`

## Summary

把模板最新两个 commit 的机制移植到本插件，内容按本插件改写：

- 元数据国际化：为 `locale/en.json` 与 `locale/zh.json` 增加结构、键集与禁用字符校验（`tests/metadata.test.ts`），新增 `docs/i18n.md`，宪章原则 IX 扩展元数据条款，文档索引与相关文档补入口。
- 产物新鲜度：新增 `tests/support/dist-freshness.ts` 与 `tests/dist-freshness.test.ts`；`tests/client-bundle.test.ts`、`tests/package-pack.test.ts` 改为断言产物新鲜，不再在测试内触发构建；vitest 拆 `code` 与 `dist` 两个 project；`build` 末尾运行 `test:dist`，`check` 运行 `test:code`。
- 宪章同步：原则 IV 补 `locale/*.json` 与 `icon.svg` 的进包清单，原则 VI 把合并门禁改为 `pnpm full-check`，版本 1.10.0 → 1.11.0。

## Technical Context

**Language/Version**: TypeScript 6；浏览器侧 React 18；JSON 元数据资源

**Primary Dependencies**: 无新增依赖。测试使用 `node:fs`、`node:path`、`node:url` 与 vitest 4 的 `projects`

**Storage**: `locale/<语言 id>.json` 随包分发；`dist/` 为本地产物

**Testing**: vitest 4（node），`npm pack --dry-run --json` 回归打包内容，`playwright` 用于实机核对

**Target Platform**: DSH 0.2.2-rc.3 宿主，Web GUI

**Project Type**: DSH 插件 npm 包

**Performance Goals**: `test:code` 不读取 `dist`，删除 `dist` 后仍可通过；`build` 一次构建加产物测试在一个命令内完成

**Constraints**: 基线语言固定 `zh` 与 `en`；产物清单为 `dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts`；构建输入为 `src/`、`tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`

**Scale/Scope**: 新增 4 个测试与支持文件、1 份文档；修改 `package.json`、`vitest.config.ts`、2 个产物测试、宪章、`AGENTS.md`、`README.md`、`docs/` 3 份文档、CI 与 `CHANGELOG.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 入口导出、`inject` 与 `Config` 均不变；元数据由宿主按 `exports` 读取 |
| II 依赖归属 | 通过 | 不新增依赖；测试只使用 Node 内置模块与已有 vitest |
| III 严格配置 | 通过 | 不涉及配置 schema |
| IV 测试同步 | 通过 | 新增元数据与新鲜度测试；发布内容回归仍由 `tests/package-pack.test.ts` 承担，并补 `locale/*.json`、`icon.svg` 进包条目 |
| V 文档结构 | 通过 | 国际化规范单归属 `docs/i18n.md`；命令说明归属 `docs/development.md`；`AGENTS.md` 只放索引与项目说明 |
| VI 质量门禁 | 需修订 | `check` 不再读取 `dist`，合并门禁改为 `pnpm full-check`，使发布内容回归仍在合并前运行 |
| VII 工具契约 | 通过 | 工具名、参数与返回不变 |
| VIII 公开引用 | 通过 | 文档与测试只引用仓库内路径，不写本机绝对路径 |
| IX 界面文案与本地化 | 需扩展 | 现有条款只覆盖前端字典；增加 `locale/*.json` 元数据资源、键集一致、清单声明与禁用字符条款 |

**GATE 结论**: 通过。原则 IV、VI、IX 的修订在本需求内完成，见 Phase 1 与 tasks 的宪章阶段。

## Project Structure

### Documentation (this feature)

```text
specs/013-template-sync/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── metadata-resources.md
│   ├── package-manifest.md
│   └── test-scripts.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
locale/
├── en.json                   # meta.title、meta.description，键集与中文一致
└── zh.json                   # 键集事实源
package.json                  # scripts 拆分；exports/files 已声明 locale/*.json
vitest.config.ts              # code 与 dist 两个 project
tests/
├── metadata.test.ts          # 元数据结构、键集、禁用字符、detail 与清单声明
├── dist-freshness.test.ts    # 新鲜度判定的四种状态
├── support/dist-freshness.ts # assertFreshDist 与产物清单
├── client-bundle.test.ts     # 改为 assertFreshDist
└── package-pack.test.ts      # 改为 assertFreshDist
docs/
├── i18n.md                   # 国际化规范（唯一归属）
├── development.md            # 命令表、CI 说明、测试文件表
├── how-it-works.md           # 元数据与字典规范入口
└── known-risks.md            # 国际化风险条目
.github/workflows/ci.yml      # check job 名称
.specify/memory/constitution.md  # 原则 IV、VI、IX 修订，版本 1.11.0
AGENTS.md                     # 项目说明、文档索引与章节顺序
README.md                     # 标题与描述随语言切换
CHANGELOG.md                  # Unreleased 条目
```

**Structure Decision**: 元数据资源留在仓库根 `locale/`，符合宿主读取约定；产物新鲜度检查放 `tests/support/`，与既有 `tests/support/primitives.ts` 同一位置；测试分组由 `vitest.config.ts` 的 `projects` 表达。

## Complexity Tracking

无偏离。三处宪章修订是本需求的产物：原则 IV 补进包清单、原则 VI 把合并门禁改为 `full-check`、原则 IX 扩展元数据条款。三者按治理条款以 MINOR 版本递增落地。
