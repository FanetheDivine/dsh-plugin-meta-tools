# Implementation Plan: 插件消息投递约束

**Branch**: `fix/020-plugin-message-delivery` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-plugin-message-delivery/spec.md`

## Summary

将 `session_send` 与 `session_create` 的可选首条消息统一改为解析目标普通会话的 Agent，再以 `dsh-plugin-meta-tools` 为消息来源调用 `Agent.steer()`。`session_send` 固定为插话，删除 `mode` 输入与返回字段，并移除会改写来源的 subagent 投递回退。两处投递均使用宿主 `createUserMessage()` 构造完整消息。

## Technical Context

**Language/Version**: TypeScript 6.0，Node.js 24.9+

**Primary Dependencies**: DSH `0.2.2-rc.3`、`@deepseek-ai/dsh-agent`、`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-tools`

**Storage**: N/A

**Testing**: Vitest 源码测试、构建产物测试、真实 DSH 宿主验证

**Target Platform**: DSH Desktop 与 Web 的宿主插件

**Project Type**: 单包 DSH 插件

**Performance Goals**: 每次投递只解析一次目标 Agent，不增加持久化读写或等待

**Constraints**: 新增依赖仅允许同版本宿主包；固定插话和插件来源；保持 system-reminder 包装、空文本校验及错误前缀；普通会话之外的归属错误由宿主返回

**Scale/Scope**: `src/session-ops.ts`、`src/types.ts`、相关测试、README、机制文档与发布产物

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结果 | 核对 |
| --- | --- | --- |
| I. 宿主依赖版本 | PASS | 新增 `@deepseek-ai/dsh-llm@0.2.2-rc.3`，列入 `minimumReleaseAgeExclude`，其余依赖保持不变 |
| II. 测试同步 | PASS | 更新真实行为测试，覆盖 `steer`、来源、参数删除、取消和归属错误；插件接线测试使用 `tests/helpers.ts`；执行产物测试与真实宿主验证 |
| III. 文档结构 | PASS | 用户参数与限制更新 README；宿主调用机制更新 `docs/how-it-works.md`；分支交付时维护 CHANGELOG |
| IV. 质量门禁 | PASS | 文件变更后运行 `pnpm format && pnpm check`，合并前运行 `pnpm full-check` |
| V. 公开引用 | PASS | 新增文档只使用仓库相对路径、包名和公开包内文件名 |

## Project Structure

### Documentation (this feature)

```text
specs/020-plugin-message-delivery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── session-send.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── session-ops.ts          # 两处投递固定 Agent.steer 与插件来源
└── types.ts                # resolveAgent 与消息来源的最小宿主契约
tests/
├── session-ops.test.ts     # 插话、来源、错误与取消行为
├── contract.test.ts        # mode 参数删除与工具说明
└── plugin.test.ts          # 使用模拟 ctx 的端到端工具接线
README.md                   # session_send 参数、返回与目标范围
docs/
└── how-it-works.md         # Agent 解析、插话和来源机制
specs/020-plugin-message-delivery/
```

**Structure Decision**: 沿用单包结构，在现有会话操作模块内修改，不增加服务层或新模块。

## Constitution Check After Design

五项原则均通过。设计保持依赖版本，测试覆盖公开行为与真实宿主链路，文档按读者归属更新，全部引用可公开解析。

## Complexity Tracking

无。
