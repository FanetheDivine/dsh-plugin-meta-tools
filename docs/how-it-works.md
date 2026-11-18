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
| `inject` | 必需宿主服务，当前只有 `tools` |
| `apply(ctx, config)` | 插件启用时调用 |
| `Config` | 配置 schema，宿主据此校验配置并提供面板表单 |

`workspaceRegistry`、`sessionQuery`、`sessionController`、`sessions` 是可选服务，经 `ctx.inject` 获取。缺少某个服务时，只跳过依赖它的工具，插件照常加载。

## 运行流程

`apply` 依次完成四件事：

1. `readConfig` 读取配置的当前值。
2. 为 `workspaceRegistry` 建立工具组：四个工作区工具、置顶与归档。
3. 为 `sessionQuery` 建立工具组：`session_list` 与 `session_get`。
4. 为 `sessionController` 建立工具组：新建、停止与发送。
5. 监听 `loader/volatile-update`，配置变化后重新读取并同步全部工具组。

### 配置解析

`readConfig` 先把 `.volatile()` 引用展开为普通值，再交给 `resolveConfig` 做严格校验：缺省或 `null` 取默认 `true`，未知键与非布尔值抛错，结果冻结。

### 工具组同步

每个工具组持有自己的注册 disposer 列表。配置变化时先释放旧注册，再按新开关注册；服务卸载时释放整组。同名工具不会重复注册。

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

### 会话操作

- `session_create` 调 `sessionController.create`；给出标题时再调 `rename`，给出首条消息时调 `prompt`。
- `session_stop` 调 `sessionController.cancel`，只取消当前轮次。
- `session_send` 把文本包进 `<system-reminder>` 帧，转义正文里的闭合标签，再调 `prompt` 投递。
- `session_pin` 调 `pinSession` / `unpinSession`；`session_archive` 调 `archiveSession` / `unarchiveSession`。
- 归档运行中的会话需要 `stopActivity: true`，否则注册表拒绝。

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
- 表单由 `SettingsFormModel` 暂存十一个开关，`SettingsForm` 与 `Switch` 渲染，只在保存时写一次。
- 每个开关只渲染一段标签，标签同时作为无障碍名称。
- 控件使用 `--dsw-*` 主题令牌，随明暗主题与语言切换。

## 打包

- 宿主入口打包为 `dist/index.mjs`，`@deepseek-ai/*` 与 `schemastery` 保持 external，由宿主提供实例。
- 浏览器入口打包为 `dist/client.js`，包成 `window.__ModuleLoader__.load({ id, factory })` 闭包工厂。
- `files` 只发布 `dist`、`cordis.patch.yml`、`locale/*.json`、`icon.svg` 与 `README.md`。
- 宿主经 `exports['./locale/*.json']` 读取标题与描述，插件停用时照常读取。