# Contract: session_send

**Target**: DSH `0.2.2-rc.3` 的 `ctx.sessionController` 与普通会话 `Agent`

## 工具输入

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | 接收提醒的普通会话 |
| `text` | string | 是 | 非空提醒正文，包装在 system-reminder 帧中 |

工具不提供 `mode` 或其他投递方式选项。

## 宿主调用

1. `sessionController.resolveAgent(sessionId)` 解析或恢复目标普通会话。
2. 结果为 `{ error }` 时抛出该错误。
3. 结果为 `{ agent }` 时调用：

```text
agent.steer({
  content: [{ type: 'text', text: systemReminder(text) }],
  source: { kind: 'dsh-plugin-meta-tools' },
})
```

当前工具执行信号在解析前后检查。`session_send` 不调用 `sessionController.prompt` 或 `subagents.sendMessage`。`session_create` 的可选首条消息复用同一消息构造与插话函数，并保留原有错误前缀和 `prompted` 返回。

## 工具输出

```json
{
  "delivered": true,
  "sessionId": "<target-id>"
}
```

渲染文本为 `system reminder delivered to session <target-id>`。

## 错误

- `text must not be empty`
- `Could not deliver the reminder to session '<id>': <reason>`
- 当前执行信号提供的标准取消错误

## 兼容性

`mode` 输入和返回字段被移除。需要 `agent-message` 来源的 subagent 目标不再由本工具投递。`session_create` 的公开参数与返回保持不变，其可选首条消息改用插件来源插话。其他公开参数与返回保持不变。
