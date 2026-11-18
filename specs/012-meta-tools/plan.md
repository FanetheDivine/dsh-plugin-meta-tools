# Implementation Plan: 模板转化为工作区与会话工具插件

**Branch**: `feat/012-meta-tools` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-meta-tools/spec.md`

## Summary

把模板仓库转化为实际插件 `dsh-plugin-meta-tools`：移植 `@local/dsh-harness-tools` 1.0.0 的六个工具，保持定义、参数、错误与输出逐字段一致；保留插件面板配置页，改为六个以工具名命名的热重载开关；移除 `demo_echo`、agent 事件日志与前端示例行。同步修订宪章、AGENTS 与文档，并执行宪章原则 VII 的发布设置。

## Technical Context

**Language/Version**: TypeScript 6.0.3，Node.js >= 24.9，ESM

**Primary Dependencies**: `@deepseek-ai/dsh-tools` 0.2.2-rc.3（`defineTool`、`ToolArgsError`）、`@deepseek-ai/schemastery` 3.19.0（`Config`）、`@deepseek-ai/cordis` 4.1.0（类型与事件）；前端使用 React 18 与 0.2.2-rc.3 的客户端包

**Storage**: 无自有存储；读写宿主服务 `ctx.workspaceRegistry`、`ctx.sessionQuery`，并按需读取 `ctx.sessions`

**Testing**: vitest 4.1.10；宿主侧用 `tests/helpers.ts` 的模拟 ctx，前端页面用 `react-dom/server` 渲染

**Target Platform**: DSH Desktop 0.2.2-rc.3（Host + Web Client）

**Project Type**: DSH bundle（Host 插件 + Web 客户端模块）

**Performance Goals**: `session_list` 每页最多读取 40 个标题；`session_get` 单条消息上限 2000 字符、总预算 12000 字符；不读取完整会话日志

**Constraints**: 六个工具与基准插件逐字段一致；不新增依赖，不升级 `@deepseek-ai/dsh-*`；配置页沿用官方控件

**Scale/Scope**: 单 profile；工作区与会话数量由宿主决定；仓库内 6 个宿主工具、1 个配置页与 1 个插件行

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I. 宿主契约 | 通过（本特性同步修订） | 入口导出 `name`、`inject`、`apply` 与 `Config`；`name` 与插件行 id 一致。必需服务列入 `inject`，可选服务经 `ctx.inject` 获取；修订写入原则 I。 |
| II. 依赖归属 | 通过 | 无新增依赖；宿主提供的 dsh-tools、schemastery 与 cordis 保持在 `devDependencies` 且 `neverBundle`；前端平台种子保持 external。 |
| III. 严格配置 | 通过 | `readConfig` 是 `apply` 第一步；缺省与 `null` 取默认；未知键与非布尔值抛错；结果冻结。 |
| IV. 测试同步 | 通过 | 六个工具、配置开关、可选服务缺失、前端配置页与打包内容都有测试；实机验证列在 quickstart。 |
| V. 文档结构 | 通过 | README、AGENTS、宪章、`docs/` 按五类归属改写，链接不互抄。 |
| VI. 质量门禁 | 通过 | 实现后运行 `pnpm format && pnpm check`，合并前再次运行。 |
| VII. 模板定位 | 通过 | spec 声明「模板转化」；修订宪章与 AGENTS；版本改 0.1.0；确认不升级依赖；执行发布设置四项。 |
| VIII. 公开引用 | 通过 | 新增文档与代码只引用公网 URL、仓库内路径或占位符。 |

**Post-Design 复核**：设计产物没有引入新依赖、新服务或前端槽位，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/012-meta-tools/
├── plan.md              # 本文件
├── research.md          # Phase 0 决策
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 验证指南
├── contracts/
│   ├── tools.md         # 六个工具契约
│   └── config.md        # 配置与热重载契约
└── tasks.md             # Phase 2 输出（/speckit-tasks）
```

### Source Code (repository root)

```text
src/
├── index.ts             # 入口：name、inject、apply、配置同步与工具注册
├── config.ts            # 六个开关的 Config schema、默认值、严格校验与实时读取
├── constants.ts         # 插件标识、工具名、消息上限与分页上限
├── types.ts             # 宿主类型再导出与工作区/会话服务契约
├── utils.ts             # isRecord、iso、clamp、textOf
├── workspace-tools.ts   # workspace_list/create/remove/rename 与工作区视图、渲染
├── session-tools.ts     # session_list/get、标题折叠读取、消息截断与渲染
└── client/
    ├── index.ts         # 浏览器入口：注册字典与插件面板配置页
    ├── config-form.ts   # 六个开关的草稿模型与行键
    ├── config-page.tsx  # 配置页的 summary 与 page 视图
    └── locales.ts       # 配置页中英文字典

locale/
├── en.json              # 插件页标题与描述
└── zh.json
icon.svg                 # 插件图标
cordis.patch.yml         # 插件行 dsh-plugin-meta-tools
tests/                   # 单元与打包测试
docs/                    # 机制、风险与开发说明
```

**Structure Decision**: 沿用模板的单包结构；宿主逻辑按工具域拆成两个模块，前端只保留配置页。

## Phase 0 Research

见 [research.md](./research.md)。关键决策：

1. 用宿主 `defineTool` 定义六个工具，保留基准插件的参数编译与 `ToolArgsError` 语义。
2. 可选服务经 `ctx.inject` 获取，服务缺失时跳过对应工具组。
3. 配置为六个布尔热重载字段，键名等于工具名，`null` 取默认 `true`。
4. 服务类型用 `src/types.ts` 的最小结构接口，避免新增宿主依赖。
5. 插件标识统一为 `dsh-plugin-meta-tools`。
6. 发布设置按宪章原则 VII 与用户确认执行。

## Phase 1 Design

- [data-model.md](./data-model.md)：配置、工作区视图、会话列表与会话详情字段。
- [contracts/tools.md](./contracts/tools.md)：六个工具的名称、参数、返回与错误。
- [contracts/config.md](./contracts/config.md)：配置键、默认值、严格校验与热重载。
- [quickstart.md](./quickstart.md)：构建、单元测试与实机验证步骤。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| 原则 I 的可选服务条款：`inject` 只列 `tools`，其余服务经 `ctx.inject` 获取 | profile 可能未组合 `workspaceRegistry` 或 `sessionQuery`；FR-010 要求插件照常加载并只注册可用工具组 | 把两个服务列入 `inject` 会让插件在缺服务时整体停用，违背 FR-010 与基准插件行为；本特性同步修订原则 I 并递增宪章版本 |