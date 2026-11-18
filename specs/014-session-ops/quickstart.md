# Quickstart: 会话元工具与会话日志导出

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-18

以下命令在仓库根目录运行。`<repo>` 表示本地仓库路径。

## 前置

```sh
pnpm install
```

## 自动化验证

```sh
pnpm typecheck
pnpm lint
pnpm test:code
pnpm build
```

预期：

- 类型与 lint 通过。
- 源码测试覆盖十一个工具、可选服务分组、标题归并、日志导出与配置页文案。
- `build` 末尾的产物测试通过。

## 场景 1：可选服务

1. 用只带 `tools` 的模拟 ctx 加载插件，确认不抛错、注册工具数为 0。
2. 补 `workspaceRegistry`，确认出现四个工作区工具与置顶、归档工具。
3. 补 `sessionQuery`，确认出现 `session_list`、`session_get`。
4. 补 `sessionController`，确认出现新建、停止、发送。

对应测试：`tests/plugin.test.ts`。

## 场景 2：标题查询与归并

1. 准备三个会话：标题 `Alpha task`、`beta ALPHA`、`gamma`；其中 `Alpha task` 为当前会话。
2. 让 `beta ALPHA` 有一个 subagent 会话，标题 `Alpha child`。
3. 调用 `session_list` 传 `query: "alpha"`。
4. 预期：只返回 `gamma` 以外的两个主会话，当前会话不在结果内，subagent 不单独占行。

对应测试：`tests/session-tools.test.ts`。

## 场景 3：日志导出

1. 启动一个含 subagent 的会话。
2. 调用 `session_get` 传 `session_id`。
3. 打开返回的 `directory`，预期：
   - 根目录有 `session.jsonl` 或 `session.vN.jsonl`。
   - `subagents/<id>/` 下有每个后代的日志。
   - 首行是 `type: "session"` 的头对象，其后每行是事件。
4. 用文件读取工具读第一个文件，确认内容可逐行解析。

对应测试：`tests/session-log.test.ts`。

## 场景 4：会话操作

1. 调用 `session_create` 传 `cwd` 与 `prompt`，记录返回的 `sessionId`。
2. 调用 `session_list` 传 `query`，确认新会话出现。
3. 调用 `session_stop`，确认返回 `accepted: true`。
4. 调用 `session_send` 传 `sessionId` 与文本，在目标会话确认收到 `<system-reminder>` 帧。
5. 调用 `session_pin` 与 `session_archive`，在 `session_list` 的 `pinned`、`archived` 字段确认状态。

对应测试：`tests/session-ops.test.ts`。

## 场景 5：配置页

1. 打开“插件”页，进入本插件行详情。
2. 核对标题、描述、行摘要与十一行标签。
3. 切到英文，核对对应英文。
4. 关闭一个开关并保存，确认模型工具表少一个工具。

对应测试：`tests/client.test.ts`、`tests/config.test.ts`、`tests/config-form.test.ts`。

## 实机核对

在 DSH Web 中加载本地构建的插件，按场景 3 与 5 各做一次。临时目录路径由工具结果给出，不要写入工作区。