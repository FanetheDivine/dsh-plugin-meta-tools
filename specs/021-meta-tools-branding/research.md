# Research: 元工具品牌与面向用户的说明

## 详情页文档来源

- Decision: 继续用包内 `README.md` 作为详情页文档，不声明 `meta.detail`。
- Rationale: 宿主在没有 `meta.detail` 时直接展示 README，用户要求的正是 README 面向用户。
- Alternatives considered: 声明 `meta.detail` 指向单图文档。宿主规范要求该文档只含一张图，无法承载能力说明。

## 开发者信息的归属

- Decision: 工具一览、配置键与会话日志目录移入 `docs/how-it-works.md`；安装命令移入 `docs/development.md`。
- Rationale: 两份文档已承担工作机制与本地开发，宪章原则 III 要求每条信息只有一个归属。
- Alternatives considered: 新建 `docs/tools.md`。会增加一份需要索引与维护的文档，内容量不足以单列。

## 配置页分组

- Decision: 分三组：工作区、查看会话、管理会话。查看会话含 `session_list`、`session_get`；管理会话含新建、停止、发送、置顶、归档。
- Rationale: 与 `src/constants.ts` 的工具名常量一致；读与写分开，便于用户只开放只读能力。
- Alternatives considered: 按服务分四组。置顶与归档单列一组只有两项，对用户无额外意义。

## 开关行布局

- Decision: 每行左侧是标签与一句说明，右侧是 `Switch`；分组标题沿用 lark-bridge 插件的小号大写样式；行间用 `--dsw-alias-border-l2` 分隔线。
- Rationale: 与同一宿主中已有插件配置页的视觉一致，全部使用主题令牌。
- Alternatives considered: 用 `DisclosureRow` 折叠分组。十一项无需折叠，折叠会隐藏写操作开关。

## 图标

- Decision: 36×36 画布，扳手斜置居中，外围一圈约 300° 的圆弧箭头，箭头首尾相接；单色描边 `#5b7cfa`，无底板。
- Rationale: 用户选定扳手加自循环箭头；配色与相邻的 `dsh-plugin-better-mcp` 图标一致；宿主规范要求不画底板、不用文字。
- Alternatives considered: 保留当前蓝色圆角底板。宿主规范要求由插件管理页绘制外框。

## 标题与描述

- Decision: 标题“元工具”与“Meta tools”。描述：
  - zh：`为 AI 提供修改自身运行环境的元工具：管理工作区，新建、指挥、置顶与归档会话，读取会话日志。`
  - en：`Meta tools that let AI change its own environment: manage workspaces; create, steer, pin, and archive sessions; read session logs.`
- Rationale: 用户选定极简标题，定位放在描述；描述点出工作区与会话。
- Alternatives considered: 标题带副标题。用户未选。
