# Implementation Plan: 元工具品牌与面向用户的说明

**Branch**: `docs/021-meta-tools-branding` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-meta-tools-branding/spec.md`

## Summary

把插件的展示面统一到“元工具”定位：

- 标题改为“元工具”与“Meta tools”，描述说明 AI 借此修改自身运行环境。
- 图标重绘为扳手加环绕箭头，去掉底板。
- `README.md` 改写为用户说明；配置键、工具契约与日志目录移入开发者文档。
- 配置页分三组，每个开关显示标签与一句说明。

配置键、保存流程与工具契约不变。

## Technical Context

**Language/Version**: TypeScript 6.0，React 18，Node.js 24.9+

**Primary Dependencies**: `@deepseek-ai/dsh-client-ui-primitives` 的 `SettingsForm` 与 `Switch`，版本 `0.2.2-rc.3`

**Storage**: N/A

**Testing**: Vitest 源码测试、构建产物测试、浏览器中查看“插件”页

**Target Platform**: DSH Web 与 Desktop 的“插件”页

**Project Type**: 单包 DSH 插件

**Performance Goals**: N/A

**Constraints**: 界面文案只来自字典；图标为 36×36 自包含 SVG，无底板、无文字；README 不含安装命令、配置键表与工具参数表

**Scale/Scope**: `locale/*.json`、`icon.svg`、`README.md`、`src/client/*`、`tests/metadata.test.ts`、`tests/client.test.ts`、`docs/*`、宪章原则 III

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结果 | 核对 |
| --- | --- | --- |
| I. 宿主依赖版本 | PASS | 不新增依赖 |
| II. 测试同步 | PASS | 更新元数据测试与配置页测试，断言分组、说明与无障碍名称；打包测试保持覆盖 `icon.svg` 与 `README.md`；在宿主“插件”页查看渲染结果 |
| III. 文档结构 | 偏离，已记录 | README 归属内容与用户要求冲突，见 Complexity Tracking；移出的信息归入 `docs/how-it-works.md` 与 `docs/development.md`，只留链接 |
| IV. 质量门禁 | PASS | 每阶段运行 `pnpm format && pnpm check`，收尾运行 `pnpm full-check` |
| V. 公开引用 | PASS | 文档只用仓库内路径与公网 URL |

## Project Structure

### Documentation (this feature)

```text
specs/021-meta-tools-branding/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── config-page.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
locale/
├── zh.json                 # 标题与描述
└── en.json
icon.svg                    # 扳手加环绕箭头
README.md                   # 用户说明
src/client/
├── locales.ts              # 分组标题、标签与说明
└── config-page.tsx         # 三组开关，每项标签加说明
tests/
├── metadata.test.ts        # 标题与描述
└── client.test.ts          # 分组、说明与开关
docs/
├── how-it-works.md         # 工具一览、配置键与会话日志目录
├── development.md          # 安装命令
└── i18n.md                 # 配置页字典键
.specify/memory/constitution.md  # 原则 III 的 README 归属内容
```

**Structure Decision**: 沿用现有结构。分组复用 `src/constants.ts` 中已有的工具名常量。

## Constitution Check After Design

原则 I、II、IV、V 通过。原则 III 的偏离按用户要求执行，并修订宪章表格使 README 归属内容与新文档一致；修订后原则 III 通过。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| 原则 III 规定 README 归属“功能、安装、配置、工具”，本次移除安装、配置、工具章节 | 用户要求 | 保留这些章节与“README 面向用户”的要求冲突；修订宪章表格后两者一致 |
