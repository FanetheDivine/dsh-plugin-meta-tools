# Contract: 元数据资源

宿主在不激活插件的前提下读取插件标题与描述，依据是 `package.json` 的声明与导出的 locale JSON。

## 资源结构

```json
{
  "meta": {
    "title": "工作区与会话工具",
    "description": "描述插件能力、用法与限制。"
  }
}
```

- 文件名 MUST 为 `<语言 id>.json`，与宿主语言 id 一致。
- `meta.title` 与 `meta.description` MUST 为非空字符串；标题单行。
- `meta.detail` 为可选字段，指向包内 `docs/*.md`。
- 文件 MUST 为 UTF-8 编码的合法 JSON，不含 U+200B 与 U+FEFF。

## 读取语义

| 情况 | 宿主行为 |
| --- | --- |
| 当前语言有资源文件 | 使用该文件的 `meta.title` 与 `meta.description` |
| 当前语言无资源文件 | 按语言回退链取下一份，最终回落 `en` |
| 资源缺 `meta.title` 或 `meta.description` | 回落 `package.json` 的 `name` 与 `description` |
| 资源缺失或非法 | 显示诊断信息，插件其余功能不受影响 |
| 插件停用 | 照常读取并显示标题与描述 |

## 前端字典（对照）

- 组件文案 MUST 经 `ctx.locale.register(<包名>, { zh, en })` 注册，`en` 与 `zh` 同时存在。
- 槽位注册 MUST 传 `locale: <包名>`，组件通过注入的 `t` 取文案。
- 字典与元数据 MUST 使用同一语言集合。
