# Host Contract: Session Controller

**Target**: DSH `0.2.2-rc.3` 的 `ctx.sessionController`

## prompt

```ts
prompt(
  request: {
    requestId: string
    sessionId: string
    mode: 'queue' | 'steer'
    content: readonly { type: 'text'; text: string }[]
  },
  signal: AbortSignal,
): Promise<{ accepted: true }>
```

- `signal` 是第二个必需参数，由当前工具执行上下文提供。
- 方法开始投递前调用 `signal.throwIfAborted()`。
- 返回值表示宿主已接受消息，不表示模型处理已经完成。
- `session_create` 的首条消息与 `session_send` 的 queue/steer 投递共用此契约。

## cancel

```ts
cancel(request: { sessionId: string }): { accepted: true }
```

- 取消目标会话的当前轮次。
- 保留待处理消息。

## 公开工具兼容性

`session_create`、`session_send` 与 `session_stop` 的名称、公开参数和返回结构保持不变。
