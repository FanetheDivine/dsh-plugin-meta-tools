# Implementation Plan: 配置新增会话的模型

**Branch**: `feat/022-configure-session-model` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-configure-session-model/spec.md`

## Summary

为 `session_create` 增加 provider、model、effort，并在插件配置页提供默认模型选择器。完整配置先经 `llm.resolveCallConfig` 校验，创建后通过 `agent.model.select` 写入新会话。配置页复用官方 `ModelSelect` 与 `ModelCatalogDirectory`，只编辑插件草稿，模型名前显示 provider，额外选项槽返回空内容。

## Technical Context

**Language/Version**: TypeScript 6.0.3，Node.js 24.9+

**Primary Dependencies**: DSH 0.2.2-rc.3，`dsh-agent`、`dsh-llm`、`dsh-client-ui-model-selection`、`dsh-api-remotes`、Cordis 4.1、tsdown 与 `@tsdown/css` 0.22.14

**Storage**: 插件配置中的 `session_provider`、`session_model`、`session_effort`；新会话日志中的 `model/selection`

**Testing**: Vitest 4，Biome，TypeScript，tsdown，真实 DSH 配置页与后端验证

**Target Platform**: DSH Desktop 与 Web 宿主

**Project Type**: DSH 插件

**Performance Goals**: 模型目录在配置页生命周期内共享；只在需要模型选择时增加一次精确配置校验

**Constraints**: provider/model 成对出现；显式参数覆盖默认值；不修改宿主全局默认；模型选择先于标题与首条消息；复用官方选择器并内联 CSS

**Scale/Scope**: 一个工具新增三个参数，插件增加三个配置字段与一个官方模型选择器

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. 宿主依赖版本：通过。** 全部新增 `@deepseek-ai/*` 依赖锁定 0.2.2-rc.3，并加入 `minimumReleaseAgeExclude`；`@tsdown/css` 与 tsdown 同版本。
- **II. 测试同步：通过。** 更新配置、session-ops、contract、plugin、client 与 bundle 测试，新增 model-defaults 测试，执行完整 package-pack 回归与真实宿主验证。
- **III. 文档结构：通过。** README 记录用户能力，how-it-works 记录机制与契约，known-risks 记录内部接口与失败边界，CHANGELOG 增加条目。
- **IV. 质量门禁：通过。** 运行 `pnpm format && pnpm check`，交付前运行 `pnpm full-check`。
- **V. 公开引用：通过。** 跟踪文件只使用仓库内相对路径、包路径与公网链接。

**Post-design re-check**: 五项全部通过。官方源码子路径的升级风险记录在 known-risks。

## Project Structure

### Documentation (this feature)

```text
specs/022-configure-session-model/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/session-create.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts
├── session-ops.ts
├── types.ts
├── config.ts
├── constants.ts
├── css.d.ts
└── client/
    ├── index.ts
    ├── config-form.ts
    ├── config-page.tsx
    ├── model-defaults.ts
    └── locales.ts

tests/
├── contract.test.ts
├── plugin.test.ts
├── session-ops.test.ts
├── config.test.ts
├── config-form.test.ts
├── model-defaults.test.ts
├── client.test.ts
└── client-bundle.test.ts
```

**Structure Decision**: 沿用单插件结构。后端选择归入 `session_create`，前端目录状态独立到 `model-defaults.ts`，不修改 DSH 原生会话界面。

## Complexity Tracking

无偏离。
