# Quickstart: 会话消息投递修复

## 前置条件

- Node.js 24.9 及以上，pnpm 11。
- 已安装依赖。
- 真实宿主验收使用 DSH `0.2.2-rc.3` 和本次构建的插件包。

## 自动验证

1. 运行 `pnpm test:code -- tests/session-ops.test.ts`，确认首条消息、queue 与 steer 均把当前执行信号交给宿主测试替身。
2. 运行 `pnpm full-check`，确认类型、lint、源码测试、构建和发布内容测试全部通过。
3. 查看 [host-session-controller.md](./contracts/host-session-controller.md)，核对调用契约。

## 真实宿主验证

1. 安装本次构建的插件包，在新会话中启用相关工具。
2. 调用 `session_create`，只提供目录；确认返回新会话 id 且 `prompted` 为 `false`。
3. 调用 `session_create`，提供目录与首条消息；确认返回 `prompted: true`，目标会话出现首条消息并开始处理。
4. 对空闲目标会话调用 `session_send`，分别使用 queue 与 steer；确认返回 `delivered: true` 且目标会话收到 system-reminder 帧。
5. 让目标会话执行一个可持续观察的任务，再调用 `session_stop`；确认当前处理停止。
6. 再次向该会话发送消息；确认会话停止后仍可接收并处理后续消息。
7. 全程确认不再出现 `Cannot read properties of undefined (reading 'throwIfAborted')`。
