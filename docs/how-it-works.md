# 工作机制

## 插件组成

DSH 插件是一个 npm 包。宿主按约定的入口加载宿主部分，按 `package.json` 的 `dsh.client` 加载浏览器部分。

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包元数据、发布内容 `files`、展示资源与客户端声明 |
| `cordis.patch.yml` | 插件行，`dsh plugin add` 时插入 |
| `locale/*.json` | 插件页标题、描述与详情 |
| `icon.svg` | 插件图标 |
| `src/index.ts` | 唯一打包入口 |
| `src/client/index.ts` | 浏览器入口 |

## 入口契约

宿主 loader 识别 `src/index.ts` 导出的四个符号。

| 导出 | 含义 |
| --- | --- |
| `name` | 插件标识，与 `cordis.patch.yml` 的 id 一致 |
| `inject` | `apply` 直接使用的必需宿主服务，当前只有 `tools` |
| `apply(ctx, config)` | 插件启用时调用 |
| `Config` | 配置 schema，宿主据此校验配置并提供面板表单 |

- `src/index.ts` 只导出表中四个符号。
- 需要热重载的 `Config` 字段用 `.volatile()` 标记。
- 宿主类型经 `src/types.ts` 以 type-only 方式导入。
- `workspaceRegistry`、`sessionQuery`、`sessionController`、`sessions` 是可选服务，经 `ctx.inject` 获取。缺少某个服务时，只跳过依赖它的工具，插件照常加载。
- `llm` 是可选模型校验服务。缺少时不影响现有工具，只有指定模型的新建会话会报错。

## 运行流程

`apply` 依次完成五件事：

1. `readConfig` 读取配置的当前值。
2. 为 `workspaceRegistry` 建立工具组：四个工作区工具、置顶与归档。
3. 为 `sessionQuery` 建立工具组：`session_list` 与 `session_get`。
4. 为 `sessionController` 建立工具组：新建、停止与发送。
5. 监听 `loader/volatile-update`，配置变化后重新读取并同步全部工具组。

### 配置解析

配置解析是 `apply` 的第一步。`readConfig` 先把 `.volatile()` 引用展开为普通值，再交给 `resolveConfig` 做严格校验：

- 缺省或 `null` 的键使用默认值 `true`。
- 未知键与非布尔值抛错，插件加载失败。
- 解析结果冻结后返回。

### 配置键

- 十一个工具开关键与工具名相同，类型为布尔，默认 `true`。
- `session_provider`、`session_model`、`session_effort` 是新增会话的默认模型字符串，默认空字符串；provider 与 model 必须成对配置，effort 依赖完整路由。
- 全部字段标记 `.volatile()`：在“插件”页的行配置页保存后，插件不重启，工具按新配置同步。
- 手写配置示例：

```yaml
- id: dsh-plugin-meta-tools
  name: dsh-plugin-meta-tools
  config:
    workspace_remove: false
    session_archive: false
```

### 工具组同步

每个工具组持有自己的注册 disposer 列表。配置变化时先释放旧注册，再按新开关注册；服务卸载时释放整组。同名工具不会重复注册。

## 工具一览

| 工具 | 参数 | 返回 |
| --- | --- | --- |
| `workspace_list` | 无 | 工作区数量与逐项 id、标题、路径、状态、会话计数 |
| `workspace_create` | `path`、`title?` | `created`、工作区视图与可选说明 |
| `workspace_remove` | `workspace_id` | `removed`、被移除的 id 与路径 |
| `workspace_rename` | `workspace_id`、`title` | 更新后的工作区视图 |
| `session_list` | `workspace_id?`、`cwd?`、`query?`、`limit?`、`titles?`、`include_archived?` | 会话总数、本页摘要与可选说明 |
| `session_get` | `session_id` | 临时目录、主会话文件、全部文件与 subagent 数 |
| `session_create` | `workspace_id?`、`cwd?`、`agent_preset?`、`provider?`、`model?`、`effort?`、`title?`、`prompt?` | 新会话 id、预设、标题与是否已投递首条消息 |
| `session_stop` | `session_id` | `accepted` 与会话 id |
| `session_send` | `session_id`、`text` | `delivered` 与会话 id |
| `session_pin` | `session_id`、`remove?` | `pinned` 与会话 id |
| `session_archive` | `session_id`、`remove?`、`stop_activity?` | `archived` 与会话 id |

## 工具行为

### 工作区

- 读取 `ctx.workspaceRegistry`：`list`、`get`、`resolveByPath`、`create`、`delete`，以及归档与置顶集合。
- `workspace_create` 先按路径查重，已注册时返回 `created: false`。
- `workspace_remove` 只调用注册表的 `delete`，不触碰目录与会话日志。

### 会话列表

- `session_list` 读取 `ctx.sessionQuery.listSessions`，按工作区、目录与归档状态过滤。
- 记录沿父链归并到主会话，同一主会话只出现一行；调用方会话被排除。
- `query` 对折叠标题做大小写不敏感的子串匹配；标题扫描上限 200。
- 标题由 `readTitleSnapshots` 批量折叠；单个失败被忽略，整批失败附 `note`。

### 会话日志导出

- `session_get` 调 `traceSession` 取得主会话与全部后代。
- 每个活动会话先经 `sessions.flush` 落盘，再调 `readSession` 读取完整日志。
- 日志序列化为规范 JSONL：会话头一行，其后每行一个事件。
- 文件写入系统临时目录下的独立目录，返回主文件与全部路径；不写工作区。
- 文件名与内容对齐宿主 `/export` 的日志产物，但不打包 ZIP，也不导出附件。

目录结构：

```text
<系统临时目录>/dsh-plugin-meta-tools/session-logs/<session-id>-<时间戳>-<随机后缀>/
├── session.jsonl 或 session.vN.jsonl
└── subagents/<session-id>/session[.vN].jsonl
```

### 会话操作

- `session_create` 先校验显式 provider/model/effort 或插件默认模型，再调 `sessionController.create`；创建后经 `agent.model.select` 选择会话模型，最后设置标题并投递首条消息。
- 显式工具参数覆盖插件默认模型。模型选择只写入新会话，不调用会保存宿主全局默认的 `sessionController.selectModel`。
- `session_stop` 调 `sessionController.cancel`，只取消当前轮次。
- 插件插话链路用 `createUserMessage` 构造完整消息，来源固定为 `{ kind: 'dsh-plugin-meta-tools' }`，再经 `sessionController.resolveAgent` 取得普通会话 Agent 并调用 `steer`。
- `session_send` 先把文本包进 `<system-reminder>` 帧并转义正文里的闭合标签，再走同一插件插话链路。
- 两条投递链路均在解析目标前后检查当前工具调用的 `AbortSignal`。
- subagent 的专用消息路由使用其他来源，本插件拒绝通过该路由投递会话消息。
- `session_pin` 调 `pinSession` / `unpinSession`；`session_archive` 调 `archiveSession` / `unarchiveSession`。
- 归档运行中的会话需要 `stopActivity: true`，否则注册表拒绝。

## 工具契约

- 十一个工具的名称、参数、说明、错误与返回 MUST 与 `tests/contract.test.ts` 保持一致。
- 配置开关 MUST 与工具名一一对应；新增工具时 MUST 同时增加同名开关、文档与测试。
- 修改工具契约 MUST 在 spec 中说明兼容性影响。
- 移除或重命名工具 MUST 先获得用户确认。

模型依赖固定的工具名与参数形成调用习惯，契约变化会影响既有会话与外部说明。

## 前端

浏览器入口只注册插件面板的行配置页。

| 声明 | 作用 |
| --- | --- |
| `dsh.client.platform` | 只在 `web` 平台加载 |
| `dsh.client.inject` | 先加载的客户端包：locale、plugin-manager、renderer、settings |
| `exports["./client"]` | 浏览器产物 `dist/client.js` |

- 所有界面文案来自 `src/client/locales.ts`；中文字典是键集事实源，英文字典必须同键，组件只通过 `t(key)` 读取。
- 元数据资源 `locale/*.json` 供宿主在插件未激活时读取标题与描述；两处的完整规范见 [i18n.md](./i18n.md)。
- `plugins.row.config` 槽位的键是 `<包名>#<行 id>`，当前两者相同。
- 表单由 `SettingsFormModel` 暂存十一个开关与三个默认模型字段，`SettingsForm` 与 `Switch` 渲染，只在保存时写一次。
- 默认模型复用官方 `ModelSelect` 与 `ModelCatalogDirectory`；`ModelDefaults` 把目录、表单草稿与连接事件投影到同一个快照存储。
- 模型标签通过选择器扩展点在名称前显示 provider，额外选项扩展点返回空内容，因此配置页不提供团队协作开关。
- 官方 CSS Module 在构建时内联到 `dist/client.js`，运行时以固定 id 注入样式。
- 开关按 `TOOL_GROUPS` 分为工作区、查看会话、管理会话三组；默认模型位于独立的“新增会话”分组。
- 每个开关行按工具名、功能名称、开关三列排列，说明位于功能名称下方；全部开关竖直对齐。
- 功能名称同时作为开关的无障碍名称。
- 控件使用 `--dsw-*` 主题令牌，随明暗主题与语言切换。

## 依赖复用

宿主提供 cordis、dsh-tools 与 schemastery 等实例，插件运行时使用宿主的同一份实例。依赖分为两类，新增依赖时在 plan 中声明归属：

| 归属 | 放在 | 打包 |
| --- | --- | --- |
| 宿主提供 | `devDependencies` | 由 `tsdown.config.ts` 的 `neverBundle` 保持 external |
| 插件自备 | `dependencies` | 列入 `tsdown.config.ts` 的 `alwaysBundle`，打进 `dist`，由 `tests/package-pack.test.ts` 回归发布内容 |

宿主依赖的版本规则见[宪章](../.specify/memory/constitution.md)原则 I。

## 打包

- 宿主入口打包为 `dist/index.mjs`，`@deepseek-ai/*` 与 `schemastery` 保持 external，由宿主提供实例。
- 浏览器入口打包为 `dist/client.js`，包成 `window.__ModuleLoader__.load({ id, factory })` 闭包工厂。
- `files` 只发布 `dist`、`cordis.patch.yml`、`locale/*.json`、`icon.svg` 与 `README.md`。
- 宿主经 `exports['./locale/*.json']` 读取标题与描述，插件停用时照常读取。