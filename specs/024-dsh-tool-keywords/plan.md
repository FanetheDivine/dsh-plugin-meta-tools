# Implementation Plan: 工具描述标明 DSH 归属

**Branch**: `feat/024-dsh-tool-keywords` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-dsh-tool-keywords/spec.md`

## Summary

把十一个工具的顶层描述改为自包含的 DSH 表述：每条同时写出 "DSH" 与 "DeepSeek Harness" 全称，并按工具类型使用 "DSH workspace" 或 "DSH session" 限定对象。工具名、参数、参数描述、输出、错误、配置与插件元数据保持不变。契约测试同步精确文本，并新增逐工具的词串断言。

## Technical Context

**Language/Version**: TypeScript 6.0.3，Node.js >= 24.9.0

**Primary Dependencies**: DSH 0.2.2-rc.3，`@deepseek-ai/dsh-tools`；Vitest 4、Biome、tsdown

**Storage**: N/A

**Testing**: `tests/contract.test.ts` 校验描述文本与 DSH 词串；真实 DSH 会话验证 AI 选择工具

**Target Platform**: DSH Desktop 与 Web 宿主

**Project Type**: DSH 插件

**Performance Goals**: 无运行时开销；每条描述只增加一个短语

**Constraints**: 描述保持英文；只改顶层描述；工具名与参数契约不变

**Scale/Scope**: 4 个源码文件中的 11 条描述，1 个契约测试文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. 宿主依赖版本：通过。** 不新增或升级依赖。
- **II. 测试同步：通过。** 更新 `tests/contract.test.ts` 的描述断言，新增 "DSH" 与 "DeepSeek Harness" 的逐工具断言；在真实 DSH 会话验证识别效果。
- **III. 文档结构：通过。** 工具描述归代码所有；契约由 `tests/contract.test.ts` 锁定；用户能力不变，README 无需改动；CHANGELOG 在 push 前补条目。
- **IV. 质量门禁：通过。** 实施后运行 `pnpm format && pnpm check`，交付前运行 `pnpm full-check`。
- **V. 公开引用：通过。** 只引用仓库内路径与公网链接。

**Post-design re-check**: 五项全部通过。描述文本集中在契约文档，源码与测试引用同一份词串规则。

## Project Structure

### Documentation (this feature)

```text
specs/024-dsh-tool-keywords/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/tool-descriptions.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── workspace-tools.ts
├── session-tools.ts
├── session-ops.ts
└── session-log.ts

tests/
└── contract.test.ts
```

**Structure Decision**: 沿用单插件结构。描述仍写在各自的 `defineTool` 调用处，契约测试保存完整文本并额外校验词串。

## Complexity Tracking

无偏离。
