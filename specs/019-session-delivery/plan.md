# Implementation Plan: 会话消息投递修复

**Branch**: `fix/019-session-delivery` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-session-delivery/spec.md`

## Summary

修复 `session_create` 首条消息与 `session_send` 的 queue/steer 投递。两处调用按 DSH `0.2.2-rc.3` 的真实签名向 `sessionController.prompt` 传入当前工具执行信号，保持公开工具契约不变。回归测试让测试替身执行与宿主相同的信号检查，并验证修复后停止运行中会话的链路。

## Technical Context

**Language/Version**: TypeScript 6.0，Node.js 24.9+

**Primary Dependencies**: DSH `0.2.2-rc.3`、`@deepseek-ai/dsh-tools`、Cordis 4.1

**Storage**: N/A

**Testing**: Vitest 源码测试与构建产物测试；真实 DSH 宿主端到端验收

**Target Platform**: DSH Desktop 与 Web 的宿主插件

**Project Type**: 单包 DSH 插件

**Performance Goals**: 不增加额外 I/O 或等待；仅补传已有执行信号

**Constraints**: 保持十一个工具的公开契约；不新增或升级依赖；复用调用方取消信号；同步测试与机制文档

**Scale/Scope**: `src/session-ops.ts`、`src/types.ts`、相关测试、文档与发布产物验证

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结果 | 核对 |
| --- | --- | --- |
| I. 宿主依赖版本 | PASS | 保持全部依赖为 DSH `0.2.2-rc.3` 对应版本，不新增依赖 |
| II. 测试同步 | PASS | 三条投递链路均新增真实签名回归；插件接线测试使用 `tests/helpers.ts` 的模拟 `ctx`；执行 package-pack 与真实宿主验证 |
| III. 文档结构 | PASS | 用户契约不变，README 无需新增行为；宿主调用机制更新 `docs/how-it-works.md`；分支交付时维护 CHANGELOG |
| IV. 质量门禁 | PASS | 文件变更后运行 `pnpm format && pnpm check`，提交前运行 `pnpm full-check` |
| V. 公开引用 | PASS | 全部新增文档只使用仓库相对路径与包名，不记录本机绝对路径 |

## Project Structure

### Documentation (this feature)

```text
specs/019-session-delivery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── host-session-controller.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── session-ops.ts          # 两处 prompt 调用传入执行信号
└── types.ts                # SessionControllerLike 的真实签名
tests/
├── session-ops.test.ts     # 宿主信号检查与三条投递回归
└── plugin.test.ts          # 使用模拟 ctx 的插件接线回归
docs/
└── how-it-works.md         # 会话投递的取消信号机制
specs/019-session-delivery/ # 本缺陷的规格、设计、契约与验收
```

**Structure Decision**: 沿用单包结构，在现有会话操作模块内修复，不增加服务层或新模块。

## Constitution Check After Design

五项原则均通过。设计未引入依赖、存储、公开契约或项目结构变更。

## Complexity Tracking

无。
