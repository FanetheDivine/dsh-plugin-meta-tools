# Implementation Plan: 配置新增会话的模型

**Branch**: `feat/022-configure-session-model` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-configure-session-model/spec.md`

## Summary

为 `session_create` 增加 provider、model、effort 三个可选参数。完整配置先经 `llm.resolveCallConfig` 校验，创建后通过 `agent.model.select` 写入新会话，再执行标题与首条消息流程。该路径不调用会保存全局默认的 `sessionController.selectModel`。

## Technical Context

**Language/Version**: TypeScript 6.0.3，Node.js 24.9+

**Primary Dependencies**: DSH 0.2.2-rc.3，`@deepseek-ai/dsh-agent`、`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-tools`，Cordis 4.1

**Storage**: 宿主会话日志中的 `model/selection` 事件；插件无独立存储

**Testing**: Vitest 4，Biome，TypeScript，tsdown，真实 DSH 验证

**Target Platform**: DSH Desktop 与 Web 宿主

**Project Type**: DSH 插件

**Performance Goals**: 只在提供模型参数时增加一次精确模型校验；无模型参数的请求不增加异步步骤

**Constraints**: provider/model 成对出现；effort 依赖完整路由；不修改全局默认；保持现有调用兼容；模型选择先于标题与首条消息

**Scale/Scope**: 一个工具新增三个参数，更新宿主类型、入口接线、测试与用户文档

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. 宿主依赖版本：通过。** 复用现有 `@deepseek-ai/dsh-llm` 0.2.2-rc.3，不新增或调整依赖。
- **II. 测试同步：通过。** 更新 session-ops、contract 与 plugin 测试，执行完整 package-pack 回归，并进行真实宿主验证。
- **III. 文档结构：通过。** README 记录用户能力，how-it-works 记录机制与工具契约，known-risks 记录创建后失败边界，CHANGELOG 增加条目。
- **IV. 质量门禁：通过。** 文件变更后运行 `pnpm format && pnpm check`，交付前运行 `pnpm full-check`。
- **V. 公开引用：通过。** 跟踪文件只使用仓库内相对路径与包源码路径，不写入本机绝对路径。

**Post-design re-check**: 五项全部通过。设计未引入新依赖、存储、文档归属冲突或外部私有引用。

## Project Structure

### Documentation (this feature)

```text
specs/022-configure-session-model/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── session-create.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts              # 向 session_create 传入可选 llm 服务
├── session-ops.ts        # 参数、校验、创建后模型选择与执行顺序
└── types.ts              # 最小 LLM 服务结构契约

tests/
├── contract.test.ts      # 新参数与工具说明
├── plugin.test.ts        # llm 服务接线
└── session-ops.test.ts   # 成功、默认值、错误与顺序

README.md                  # 用户能力
CHANGELOG.md               # 变更条目
docs/
├── how-it-works.md        # 工具参数与会话选择机制
└── known-risks.md         # 创建后选择失败边界
```

**Structure Decision**: 沿用单插件结构。模型选择逻辑归入现有 `session_create` 实现，不新增服务或模块。

## Complexity Tracking

无偏离。
