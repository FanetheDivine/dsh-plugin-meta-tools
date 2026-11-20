# Implementation Plan: 配置新增会话的预设

**Branch**: `feat/026-session-agent-preset` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-session-agent-preset/spec.md`

**Status**: Approved

## Open Decisions

无。

## Clarifications

### Session 2026-11-21

- [D-P-001] Q: 插件的 `@deepseek-ai/*` 依赖保持 `0.2.2-rc.3`，还是升级到宿主当前的 `0.2.2-rc.5`？ -> A: 升级全部到 `0.2.2-rc.5`。
- [D-P-002] Q: 预设名册的类型从哪里来？ -> A: 从宿主获取；需要新增依赖就加，新增 `@deepseek-ai/dsh-agent-preset-registry@0.2.2-rc.5`。
- [D-P-003] Q: 插件默认预设的可用性在哪里校验？ -> A: 创建时从宿主获取可用预设；配置值在其中就使用，否则按空值处理。

## Review Record

- 2026-11-21 | Decision: Approved | Scope: current full document | Open items: none | Risks: rc.5 客户端包布局与导出漂移；不可用默认预设回退宿主默认，配置值在名册变化时不生效。

## Summary

在“元工具”配置页的“新增会话”区域把“默认模型”标签改为“模型”，并在其下方新增“预设”行：右侧 select 触发器，浮窗使用 DSH 自带 `Menu`，首项“跟随宿主默认”。插件配置新增 `session_preset`；`session_create` 按“显式参数 > 配置值（需在宿主可用名册中）> 宿主默认”解析预设。依赖升级到 `0.2.2-rc.5`，新增 preset registry 依赖获取名册类型。

## Technical Context

**Language/Version**: TypeScript 6.0.3，Node.js 24.9+

**Primary Dependencies**: DSH 0.2.2-rc.5，`dsh-agent`、`dsh-api-remotes`、`dsh-api-session-controller`、`dsh-agent-preset-registry`、`dsh-client-ui-model-selection`、`dsh-client-ui-primitives`、`dsh-client-store`、Cordis 4.1、`@tsdown/css` 0.22.14

**Storage**: 插件配置 `session_preset`；宿主预设注册表只读

**Testing**: Vitest 4，Biome，TypeScript，tsdown，真实 DSH 配置页与后端验证

**Target Platform**: DSH Desktop 与 Web 宿主

**Project Type**: DSH 插件

**Performance Goals**: 名册在配置页生命周期内读取一次；每个新建会话增加一次宿主名册读取

**Constraints**: 配置值仅在可用名册中生效；显式参数保持宿主校验；不修改宿主“新任务默认预设”；浮窗使用官方 `Menu`

**Scale/Scope**: 一个配置字段、一个配置页选择器、一次 `session_create` 解析，外加一次依赖版本升级

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. 宿主依赖版本：通过。** 全部 `@deepseek-ai/dsh-*` 升级到 `0.2.2-rc.5`，新增 registry 同版本；cordis 子包保持 `~4.1.0` 与 `~1.1.0`；同步更新 `minimumReleaseAgeExclude`。
- **II. 测试同步：通过。** 更新配置、表单、session-ops、client 与产物测试，新增预设目录与选择器测试，执行真实宿主验证。
- **III. 文档结构：通过。** README 记录配置页与默认值行为，how-it-works 记录名册与解析顺序，known-risks 记录宿主接口与回退边界，CHANGELOG 增加条目。
- **IV. 质量门禁：通过。** 变更后运行 `pnpm format && pnpm check`，交付前运行 `pnpm full-check`。
- **V. 公开引用：通过。** 跟踪文件只使用仓库内相对路径、包路径与公网链接。

**Post-design re-check**: 五项全部通过。依赖升级与名册接口的漂移风险记录在 research 与 known-risks。

## Project Structure

### Documentation (this feature)

```text
specs/026-session-agent-preset/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── config-page.md
│   └── session-create.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/
├── index.ts              # 接线：把宿主 agentPresets 传给会话工具
├── config.ts             # session_preset 字段、默认值与校验
├── constants.ts          # 默认配置键集合
├── session-ops.ts        # 预设解析与创建调用
└── client/
    ├── config-form.ts    # 草稿字段
    ├── config-page.tsx   # 模型行 + 预设行
    ├── preset-defaults.ts # 名册读取与选择写入草稿
    ├── preset-select.tsx  # 触发器 + 官方 Menu
    ├── index.ts          # 注入预设目录
    └── locales.ts        # 中英文字典

tests/
├── config.test.ts
├── config-form.test.ts
├── session-ops.test.ts
├── client.test.ts
├── preset-defaults.test.ts
└── support/primitives.ts
```

**Structure Decision**: 沿用现有单包插件结构与 `src/client` 前端入口；预设目录与选择器各用独立文件，与模型目录模式对齐。

## Module Design

- **配置**：`session_preset` 进入 `Config`、`resolveConfig`、`DEFAULT_CONFIG` 与表单字段；空值表示跟随宿主默认，不参与成对校验。
- **后端**：`SessionControlDeps` 增加可选的 `agentPresets` 服务引用；`session_create` 读取 `list()`，筛掉 `broken`，匹配配置值后传给 `sessionController.create`。
- **客户端目录**：`PresetDefaults` 经 `ctx.remote.agentPresets.list()` 读取名册，维护 loading/ready/unavailable/noService/error 状态，选择时调用表单 `edit`。
- **选择器**：`PresetSelect` 渲染触发器与 `Menu`；菜单首项空值，其后为可用预设；不可用已存值以禁用项显示。
- **字典**：新增模型标签改名与预设行、菜单与状态文案，中英文同步。

## Complexity Tracking

无宪章偏离。