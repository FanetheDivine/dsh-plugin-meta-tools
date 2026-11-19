# Contract: 插件配置页

## 结构

- `summary` 视图返回 `config.summary` 的一行文案。
- `page` 视图在 `SettingsForm` 内按分组顺序渲染三段：
  - 每段一个分组标题，带 `data-dsh-meta-tools-group="<分组键>"`。
  - 每个工具一行，带 `data-dsh-meta-tools-config="<tool>"`，含标签、说明与 `Switch`。
- `Switch` 的 `label` 等于该工具的标签。
- 只读或保存中时全部开关禁用。

## 文案

| 工具 | zh 标签 | zh 说明 |
| --- | --- | --- |
| `workspace_list` | 查看工作区 | 列出已注册的工作区、路径与会话数。 |
| `workspace_create` | 注册工作区 | 把一个已有目录加入工作区列表。 |
| `workspace_remove` | 移除工作区 | 从列表移除工作区；目录与会话日志保留。 |
| `workspace_rename` | 重命名工作区 | 修改工作区在侧栏显示的标题。 |
| `session_list` | 查找会话 | 按工作区、目录或标题列出会话。 |
| `session_get` | 读取会话日志 | 把会话及其 subagent 的日志导出到临时目录供 AI 阅读。 |
| `session_create` | 新建会话 | 在指定工作区新建会话，可附带首条消息。 |
| `session_stop` | 停止会话 | 停止会话当前的轮次，排队消息保留。 |
| `session_send` | 向会话发消息 | 向另一个会话插话，内容以 system-reminder 送达。 |
| `session_pin` | 置顶会话 | 置顶或取消置顶会话。 |
| `session_archive` | 归档会话 | 归档或恢复会话；运行中的会话需先停止。 |

分组标题：工作区、查看会话、管理会话。英文版同义翻译，用 sentence case。

## 不变项

- 配置键、默认值与 `SettingsFormModel` 的保存流程。
- 表单框架文案键。
