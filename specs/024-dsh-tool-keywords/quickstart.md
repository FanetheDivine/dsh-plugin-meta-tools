# Quickstart: 工具描述标明 DSH 归属

## 自动检查

```sh
pnpm format && pnpm check
```

期望：

- 契约测试通过，十一个既有断言保持不变。
- 每条描述包含 `DSH`、`DeepSeek Harness` 与对应对象词串。
- 类型检查与 lint 通过。

## 真实宿主验证

1. 运行 `pnpm build`，在已加载本插件的 DSH 中重新加载插件，确认十一个开关默认开启。
2. 在会话中发送“DSH 里有哪些工作区”，检查 AI 调用 `workspace_list`，并能说明工作区属于当前 DSH。
3. 发送“用 DeepSeek Harness 列出最近的会话”，检查 AI 调用 `session_list`，结果与侧栏一致。
4. 发送“在 DSH 里新建一个会话”，检查 AI 调用 `session_create`，参数与改动前一致。
5. 关闭任意工具的开关并保存，确认该工具不再出现在可用工具中。

## 回归检查

- 逐个调用十一个工具，确认参数校验、返回结果与错误文本与改动前一致。
- 运行 `pnpm full-check`，确认发布产物测试通过。
