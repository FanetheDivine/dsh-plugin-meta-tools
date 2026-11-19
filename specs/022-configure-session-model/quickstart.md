# Quickstart: 配置新增会话的模型

## 前置条件

- Node.js 24.9 及以上。
- pnpm 11。
- DSH 0.2.2-rc.3，具有可用的 provider 与 model。

## 自动验证

```sh
pnpm install --frozen-lockfile
pnpm exec vitest run --project code tests/session-ops.test.ts tests/contract.test.ts tests/plugin.test.ts
pnpm full-check
```

预期结果：

- 完整 provider/model/effort 按顺序完成校验、创建、会话选择、标题与首条消息。
- 不完整参数与无效模型配置在创建前失败。
- 创建后选择失败的错误包含新会话 id。
- 省略新参数的既有用例全部通过。
- 契约测试包含三个新参数，发布产物测试通过。

## 实机验证

1. 构建并按 [本地加载](../../docs/development.md#本地加载) 载入插件。
2. 确认当前全局默认模型。
3. 让 AI 调用 `session_create`，提供有效的 `provider`、`model`、`effort` 与 `prompt`。
4. 检查新会话首轮请求使用该选择，且会话日志在选择后才开始首轮。
5. 再次确认全局默认模型未变化。
6. 分别测试省略全部新参数、缺少 model、无效 effort。
7. 预期既有创建行为不变；参数与校验错误发生在创建前；无效请求不投递首条消息。
