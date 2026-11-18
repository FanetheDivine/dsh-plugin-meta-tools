# 工作机制

## 插件组成

DSH 插件是一个 npm 包。宿主按约定的入口加载宿主部分，按 `package.json` 的 `dsh.client` 加载浏览器部分。

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包元数据、发布内容 `files`、展示资源与客户端声明 |
| `cordis.patch.yml` | 插件行，`dsh plugin add` 时插入 profile |
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

`workspaceRegistry`、`sessionQuery` 与 `sessions` 是可选服务，经 `ctx.inject` 或 `ctx.get` 获取。profile 未组合某个服务时，插件照常加载，只跳过对应工具组。

## 运行流程

`apply` 依次完成四件事：

1. `readConfig` 读取配置的当前值。
2. 为 `workspaceRegistry` 建立工具组：服务可用时按开关注册四个工作区工具。
3. 为 `sessionQuery` 建立工具组：服务可用时按开关注册两个会话工具。
4. 监听 `loader/volatile-update`，配置变化后重新读取并同步两个工具组。

### 配置解析

`readConfig` 先把 `.volatile()` 引用展开为普通值，再交给 `resolveConfig` 做严格校验：缺省或 `null` 取默认 `true`，未知键与非布尔值抛错，结果冻结。

### 工具组同步

每个工具组持有自己的注册 disposer 列表。配置变化时先释放旧注册，再按新开关注册；服务卸载时释放整组。同名工具不会重复注册。

## 工具行为

### 工作区

- 读取 `ctx.workspaceRegistry`：`list`、`get`、`resolveByPath`、`create`、`delete`，以及归档与固定会话集合。
- `workspace_create` 先按路径查重，已注册时返回 `created: false`。
- `workspace_remove` 只调用注册表的 `delete`，不触碰目录与会话日志。

### 会话

- `session_list` 读取 `ctx.sessionQuery.listSessions`，按筛选条件过滤后按创建时间倒序分页。
- 标题由 `readTitleSnapshots` 批量折叠；页长超过 40 或 `titles: false` 时跳过，失败结果附在 `note`。
- `session_get` 读取 `readSurface` 取得头部与当前 surface，再取最新文本消息；`ctx.sessions` 决定 `live`。
- 消息截断、总预算与省略规则见 [README 的工具表](../README.md#工具)。

## 前端

浏览器入口只注册插件面板的行配置页。

| 声明 | 作用 |
| --- | --- |
| `dsh.client.platform` | 只在 `web` 平台加载 |
| `dsh.client.inject` | 先加载的客户端包：locale、plugin-manager、renderer、settings |
| `exports["./client"]` | 浏览器产物 `dist/client.js` |

- `plugins.row.config` 槽位的键是 `<包名>#<行 id>`，当前两者相同。
- 表单由 `SettingsFormModel` 暂存六个开关，`SettingsForm` 与 `Switch` 渲染，只在保存时写一次。
- 控件使用 `--dsw-*` 主题令牌，随明暗主题与语言切换。

## 打包

- 宿主入口打包为 `dist/index.mjs`，`@deepseek-ai/*` 与 `schemastery` 保持 external，由宿主提供实例。
- 浏览器入口打包为 `dist/client.js`，包成 `window.__ModuleLoader__.load({ id, factory })` 闭包工厂。
- `files` 只发布 `dist`、`cordis.patch.yml`、`locale/*.json`、`icon.svg` 与 `README.md`。
