# Data Model: 元工具品牌与面向用户的说明

本次不改变运行时数据。只涉及展示文案与分组。

## 能力分组

| 分组键 | 工具 | 性质 |
| --- | --- | --- |
| `workspace` | `workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename` | 读与写 |
| `sessionRead` | `session_list`、`session_get` | 只读 |
| `sessionManage` | `session_create`、`session_stop`、`session_send`、`session_pin`、`session_archive` | 写 |

规则：

- 三组合并后恰好覆盖 `TOOL_NAMES`，顺序与 `TOOL_NAMES` 一致。
- 每个工具只属于一组。

## 字典键

| 键 | 用途 |
| --- | --- |
| `config.summary` | 配置页一行概述 |
| `config.group.<分组键>` | 分组标题 |
| `config.<tool>.label` | 开关标签与无障碍名称 |
| `config.<tool>.description` | 开关说明 |
| `config.unavailable` 等 | 表单框架文案，保持不变 |
