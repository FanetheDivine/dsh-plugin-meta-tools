# Research: 模板转化为工作区与会话工具插件

## 工具定义方式

- **Decision**: 使用宿主 `@deepseek-ai/dsh-tools` 的 `defineTool` 定义六个工具，参数与输出沿用基准插件的 schema 字面量。
- **Rationale**: 基准插件用 `defineTool` 编译参数 schema、校验入参并抛出 `ToolArgsError`。直接复用可保证参数错误文案、必填校验与输出 schema 投影完全一致。
- **Alternatives considered**: 模板的纯 `ToolDefinition` + zod 手写校验。需要复刻参数编译与错误码，容易与基准产生差异。

## 可选服务接入

- **Decision**: `inject` 只声明 `tools`；`workspaceRegistry`、`sessionQuery` 通过 `ctx.inject` 等待可用；`sessions` 用 `ctx.get` 读取。
- **Rationale**: Cordis 的 `inject` 是加载前置条件，缺少任一服务会导致插件整体不加载。基准插件在缺服务时仍加载并只注册可用工具组，`ctx.inject` 能保持该行为。
- **Alternatives considered**: 把两个服务列入 `inject`。会违背 FR-010。轮询 `ctx.get` 需要额外定时器，且无法感知服务卸载。

## 配置模型

- **Decision**: `Config` 声明六个布尔字段，键名等于工具名，`.default(true).volatile()`；严格校验拒绝未知键与非布尔值；`null`/缺省取默认 `true`；保存后监听 `loader/volatile-update` 重新注册。
- **Rationale**: 与模板既有的严格配置实现一致，满足澄清结果与宪章原则 III；`.volatile()` 让面板表单出现并触发热重载。
- **Alternatives considered**: 用一组动态键。schema 与面板表单需要静态字段声明；三态可空开关超出宿主 `Switch` 的表达。

## 工具组注册与同步

- **Decision**: 每个可选服务对应一个工具组；服务可用时注册启用的工具，配置变化时先释放旧注册再按新配置注册；服务卸载时释放该组。
- **Rationale**: 注册函数返回精确的 disposer；按组释放在服务与配置两条变化来源下都不会重复注册同名工具。
- **Alternatives considered**: 只在 `apply` 时注册一次。无法响应配置开关与服务晚到。

## 服务类型

- **Decision**: 在 `src/types.ts` 声明只包含已用方法的结构接口：`WorkspaceRegistryLike`、`SessionQueryLike`、`WorkspaceLike`、`SessionRecordLike` 等；不新增 `@deepseek-ai/dsh-workspace` 与 `@deepseek-ai/dsh-session-query` 依赖。
- **Rationale**: 已核对宿主 0.2.2-rc.3 源码：`Workspace` 暴露 `id/title/path/sessionIds/createdAt/updatedAt/status()/setTitle()`；`SessionQueryEngine` 暴露 `listSessions(signal)`、`readSurface(id)`、`readTitleSnapshots(ids, signal)`。最小接口覆盖这些调用，避免两个包带来的 peer 依赖与版本同步成本。
- **Alternatives considered**: 把两个宿主包加入 `devDependencies` 并 type-only 导入。会增加依赖树与 `minimumReleaseAgeExclude` 条目，且本插件只用到其中少数字段。

## 前端配置页

- **Decision**: 保留 `SettingsFormModel`、`SettingsForm` 与 `Switch`，渲染六行开关；每条字典键按工具名生成；移除 dock 行、`conversation.composer.dock` 注册与 `demo-dock.tsx`。
- **Rationale**: 与官方配置页控件一致；现有测试与主题令牌可复用；澄清结果要求只保留配置页。
- **Alternatives considered**: 自定义表单控件。与官方样式和保存语义不一致。

## 插件标识

- **Decision**: 包名、插件行 id 与入口 `name` 统一为 `dsh-plugin-meta-tools`；配置页键为 `dsh-plugin-meta-tools#dsh-plugin-meta-tools`；前端命名空间同名。
- **Rationale**: 宪章原则 I 要求 `name` 与插件行 id 一致；沿用模板「包名 = 行 id」的写法，减少三处不一致。
- **Alternatives considered**: 行 id 取短名 `meta-tools`。需要额外同步文档与配置页键。

## 测试策略

- **Decision**: 扩展 `tests/helpers.ts` 的宿主 ctx 模拟，支持 `inject`、`get` 与服务装卸；用假注册表与假会话查询覆盖六个工具的成功、错误、截断与预算分支；配置页用 `react-dom/server` 渲染。
- **Rationale**: 现有测试基础设施已记录注册、事件与日志；补服务模拟即可覆盖真实接线。
- **Alternatives considered**: 只测纯函数。无法覆盖开关与服务缺失的接线。

## 发布设置

- **Decision**: 版本设为 0.1.0；恢复 CI 的 `publish` tag 触发并删除 `if: false`；删除 `specs/001` 至 `specs/011` 与 `changelogs/` 内容；`CHANGELOG.md` 重置为标题；输出 npm Trusted Publisher 绑定提醒。
- **Rationale**: 用户确认执行宪章原则 VII；版本 0.1.0 是本插件首个发布版本。
- **Alternatives considered**: 保留历史 spec 与 changelog。与宪章原则 VII 冲突。

## 版本与依赖

- **Decision**: 保持 `@deepseek-ai/dsh-*` 0.2.2-rc.3，与当前 Desktop 宿主一致；不新增依赖。
- **Rationale**: 用户明确选择不升级；实机验证可直接使用当前宿主。
- **Alternatives considered**: 升级到 npm 最新版本。需要额外的实机安装与验证，且可能与当前宿主不一致。