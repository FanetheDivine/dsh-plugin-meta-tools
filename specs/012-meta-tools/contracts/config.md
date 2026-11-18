# 配置契约

## 配置键

| 键 | 类型 | 默认 | 热重载 |
| --- | --- | --- | --- |
| `workspace_list` | boolean | `true` | 是 |
| `workspace_create` | boolean | `true` | 是 |
| `workspace_remove` | boolean | `true` | 是 |
| `workspace_rename` | boolean | `true` | 是 |
| `session_list` | boolean | `true` | 是 |
| `session_get` | boolean | `true` | 是 |

## 解析规则

1. `apply` 第一步读取配置：逐个展开热重载引用后交给严格校验。
2. 输入为 `undefined` 或 `null` 时按空对象处理。
3. 输入不是普通对象时报错：`dsh-plugin-meta-tools: config must be an object`。
4. 未知键报错：`dsh-plugin-meta-tools: unknown config key "<key>"`。
5. 非布尔值报错：`dsh-plugin-meta-tools: config <key> must be a boolean`。
6. 缺省、`undefined` 或 `null` 的键取 `true`。
7. 返回冻结的完整配置。

## 热重载

- 六个字段都标记 `.volatile()`，修改后插件不重启。
- 宿主发出 `loader/volatile-update` 后重新读取配置。
- 读取失败时记录警告、保持当前注册状态。
- 读取成功后释放两组工具的旧注册，再按新开关与当前可用服务重新注册。

## 面板配置页

- 槽位：`plugins.row.config`，键 `dsh-plugin-meta-tools#dsh-plugin-meta-tools`。
- 表单命名空间：行 id `dsh-plugin-meta-tools`。
- 每个工具一行：左侧标题与说明，右侧 `Switch`。
- 开关关闭表示配置写为 `false`；开启写为 `true`。
- 保存失败、只读与不可用状态沿用官方表单文案。
- 控件使用 `--dsw-*` 主题令牌，随明暗主题切换。