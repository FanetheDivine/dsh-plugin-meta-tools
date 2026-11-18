# Implementation Plan: 会话元工具与会话日志导出

**Branch**: `feat/014-session-ops` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-session-ops/spec.md`

## Summary

把插件从「六个只读元工具」扩展为「十一个元工具」，并收紧交付方式：

- 服务可选：除 `tools` 外全部服务按工具组可选，缺服务只跳过对应工具。
- `session_list` 增加标题子串查询，排除调用方会话，subagent 归并到主会话。
- `session_get` 改为把主会话与全部后代 subagent 的规范 JSONL 写入系统临时目录，返回文件路径。
- 新增 `session_create`、`session_stop`、`session_send`、`session_pin`、`session_archive`。
- 全部面向模型与界面的描述去掉 “profile”。
- 配置页改为十一行单标签，元数据与摘要按用户给定文案。

技术路径：沿用现有 `buildXxxTool` 工厂与 `ctx.inject` 分组，按服务拆成四个工具组；新增会话树与日志序列化模块；不新增依赖。

## Technical Context

**Language/Version**: TypeScript 6（Node ≥ 24.9）

**Primary Dependencies**: 宿主 `@deepseek-ai/dsh-tools`、`@deepseek-ai/cordis`；无新增运行时依赖

**Storage**: 系统临时目录下的 JSONL 文件；配置与元数据仍在仓库文件

**Testing**: vitest 4；`pnpm test:code`、`pnpm build` 的产物测试；Playwright 用于实机核对

**Target Platform**: DSH 0.2.2-rc.3，Web 宿主，Windows 与 macOS 路径兼容

**Project Type**: DSH 插件 npm 包

**Performance Goals**: 标题查询最多折叠 200 个会话的标题；导出按会话逐个读取，单文件流式写入磁盘

**Constraints**: 工具说明、参数说明与错误为英文；界面文案中英双语；不写工作区目录；工具名保持既有六个不变

**Scale/Scope**: 11 个工具、11 个开关、4 个工具组、3 个新增源文件、6 个测试文件更新、README 与 3 份 docs 更新

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | `inject` 仍为 `['tools']`；其余服务经 `ctx.inject` 获取，缺失时插件保持加载 |
| II 依赖归属 | 通过 | 不新增依赖；日志写盘使用 Node 内置模块 |
| III 严格配置 | 通过 | 十一个键严格校验，缺省取默认，未知键与非法值抛错 |
| IV 测试同步 | 通过 | 十一工具契约、会话树、日志导出、五个会话操作、可选分组与文案均有测试；发布内容不变 |
| V 文档结构 | 通过 | `README.md` 更新工具表；`docs/how-it-works.md` 更新分组与导出流程；`docs/known-risks.md` 更新临时目录与服务缺失风险；`docs/i18n.md` 同步标签键 |
| VI 质量门禁 | 通过 | 变更后运行 `pnpm format && pnpm check`，合并前 `pnpm full-check` |
| VII 工具契约 | 需偏离 | 用户要求改变 `session_get` 的返回形态并新增五个工具；工具名不改，兼容性影响已写入 spec 的「兼容性影响」 |
| VIII 公开引用 | 通过 | 文档与测试只引用仓库内路径与占位符，不写本机绝对路径 |
| IX 界面文案与本地化 | 通过 | 界面文案全部来自字典；模型文案按原则 VII 保持英文 |

**GATE 结论**: 通过。VII 的偏离由用户要求触发，已在 Complexity Tracking 记录。

## Project Structure

### Documentation (this feature)

```text
specs/014-session-ops/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/tools.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── constants.ts              # 11 个工具名、开关、扫描与文件上限
├── config.ts                 # 11 个 volatile 开关与严格校验
├── index.ts                  # 四个工具组：workspace、sessionQuery、sessionController、registry
├── types.ts                  # 新增服务契约与会话字段
├── utils.ts                  # 现有工具函数
├── workspace-tools.ts        # 四个工作区工具，文案去 profile
├── session-tools.ts          # session_list：查询、归并、排除调用方
├── session-log.ts            # session_get：会话树、JSONL、临时目录
├── session-ops.ts            # create/stop/send/pin/archive
└── client/
    ├── config-page.tsx       # 十一行单标签
    ├── config-form.ts        # 十一个开关字段
    ├── locales.ts            # 中英文字典
    └── index.ts

locale/
├── en.json                   # meta.title / meta.description
└── zh.json

tests/
├── contract.test.ts          # 11 个工具契约
├── workspace-tools.test.ts   # 文案与行为
├── session-tools.test.ts     # 查询、归并、排除
├── session-log.test.ts       # 导出目录与 JSONL
├── session-ops.test.ts       # 五个操作
├── plugin.test.ts            # 可选服务分组
├── client.test.ts            # 界面文案与渲染
└── config.test.ts            # 11 个键

README.md                     # 工具表、配置表、限制
docs/how-it-works.md          # 分组与导出流程
docs/known-risks.md           # 临时目录与服务缺失
docs/i18n.md                  # 标签键说明
CHANGELOG.md                  # 合并时补条目
```

**Structure Decision**: 会话能力按读、导出、操作拆成三个模块，避免单文件超过 400 行；会话树与标题归并的公共函数放在 `session-tools.ts` 内并导出，供列表与导出复用，避免新增通用模块。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| 原则 VII 的基准兼容性 | 用户明确要求 `session_get` 改为落盘交付，并新增五个会话操作工具 | 保持旧契约无法满足「日志交给 AI 读」与跨会话编排；保留工具名已把破坏面限制在 `session_get` 的返回与参数 |
| 会话日志写盘 | 模型需要按需分段读取大日志 | 继续在工具结果内返回消息会挤占上下文；写 ZIP 则模型无法直接读取 |