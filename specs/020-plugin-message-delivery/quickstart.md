# Quickstart: 插件消息投递约束

## 前置条件

- Node.js 24.9 及以上，pnpm 11。
- 已安装依赖。
- 真实宿主验收使用 DSH `0.2.2-rc.3` 和本次构建的插件包。

## 自动验证

1. 运行 `pnpm test:code -- tests/session-ops.test.ts tests/contract.test.ts tests/plugin.test.ts`，确认固定插话、插件来源、参数删除、取消和归属错误用例通过。
2. 运行 `pnpm full-check`，确认类型、lint、源码测试、构建和发布内容测试全部通过。
3. 查看 [session-send.md](./contracts/session-send.md)，核对公开工具与宿主调用契约。

## 真实宿主验证

1. 安装本次构建的插件包，在新会话中启用 `session_send` 和 `session_get`。
2. 对一个普通目标会话调用 `session_send`，只提供 `session_id` 和 `text`；确认返回仅有 `delivered` 与 `sessionId`。
3. 调用 `session_create` 并提供首条消息，确认其日志同样记录插件来源的插话。
4. 用 `session_get` 导出目标日志，确认上述新 `user/message` 的 `data.source.kind` 均为 `dsh-plugin-meta-tools`；`session_send` 正文保留 system-reminder 帧，`session_create` 正文为首条消息原文。
5. 让目标会话执行可持续观察的任务，再次投递；确认消息在最近步骤边界生效。
6. 对空闲目标投递；确认目标开始新轮次。
7. 对 subagent 目标投递；确认返回宿主归属错误，且没有新增消息。
8. 检查 `session_send` 的参数与返回说明均不包含 `mode`。
