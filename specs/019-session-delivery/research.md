# Phase 0 Research: 会话消息投递修复

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-19

## 宿主契约

当前运行宿主与项目依赖均为 DSH `0.2.2-rc.3`。`@deepseek-ai/dsh-api-session-controller` 的 `src/index.ts` 定义：

- `sessionController.create(request)` 新建会话。
- `sessionController.prompt(request, signal)` 投递消息，入口首先执行 `signal.throwIfAborted()`。
- `sessionController.cancel(request)` 取消当前轮次。

插件的 `SessionControllerLike.prompt` 只声明了一个参数，`session_create` 与 `session_send` 也都只传了请求对象。这直接解释了两处相同的 `throwIfAborted` 空对象错误。该缺陷来自插件调用签名不完整，宿主版本保持一致。

## 决策

### D1 传递调用方取消信号

- **Decision**: 两处 `prompt` 调用均把当前工具执行上下文的 `exec.signal` 作为第二个参数传给宿主，并同步修正最小结构类型。
- **Rationale**: 符合宿主真实签名，同时保留调用方取消语义。
- **Alternatives considered**: 新建独立 `AbortSignal` 会切断调用方取消；省略信号会持续报错；把信号放入请求对象不符合宿主契约。

### D2 回归测试模拟真实入口

- **Decision**: 测试替身实现 `prompt(request, signal)` 并调用 `signal.throwIfAborted()`，分别覆盖首条消息、queue 与 steer；另断言第二参数与工具执行信号相同。
- **Rationale**: 旧测试替身接收单个参数，无法发现漏传。真实入口行为可直接复现原缺陷。
- **Alternatives considered**: 只断言结果成功会继续使用过于宽松的替身；仅做类型检查不能覆盖运行时 JavaScript 调用。

### D3 保持公开工具契约

- **Decision**: 保持工具名称、参数、返回结构与 system-reminder 包装规则不变。
- **Rationale**: 缺陷仅在内部宿主调用，用户无需改变调用方式。
- **Alternatives considered**: 新增公开 `signal` 参数会暴露无意义的实现细节；改变投递语义超出缺陷范围。

### D4 停止能力验证

- **Decision**: 保留 `session_stop` 实现，在消息能触发真实运行后执行取消验证。
- **Rationale**: 用户此前无法构造运行中轮次；修复投递后即可验证原有停止链路。
- **Alternatives considered**: 在未复现问题前修改取消逻辑会扩大变更范围。

### D5 依赖与发布

- **Decision**: 不新增依赖，不升级 DSH；通过源码测试、构建产物测试与真实宿主验收覆盖发布路径。
- **Rationale**: 当前依赖版本与宿主一致，缺少参数由现有代码修复即可。
- **Alternatives considered**: 升级依赖不能修正调用参数；引入控制器包仅为一个签名增加依赖没有必要。

## 未决项

无。
