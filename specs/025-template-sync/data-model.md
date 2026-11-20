# Data Model: 同步模板热更新实机流程与前端链接规则

**Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

本次没有持久化数据结构。下表列出规格中的实体与仓库产物的对应关系。

| 实体 | 载体 | 关键属性 | 验证方式 |
| --- | --- | --- | --- |
| 实机 profile | `~/.dsh/profiles/<name>/` | 插件依赖为链接、`cordis.patch.yml`、驱动脚本、截图 | 检查 `node_modules/<插件>` 指向仓库 |
| 补丁 HMR 条目 | `cordis.patch.yml` 的 `- id: hmr` | `config.root` 指向仓库 `dist` | 读取补丁文本 |
| 插件加载源 | profile 的 `node_modules/<插件>` 符号链接 | 版本、`dist/index.mjs` 哈希 | A1 断言与文件比较 |
| 前端产物 | 仓库 `dist/client.js` | 配置页文案等界面文本 | 构建后在 GUI 核对 |
| 热更新验证记录 | `references/cases.md` 的报告结构 | 结论与截图 | 报告一节 |

## 状态变化

| 阶段 | profile | 运行实例 |
| --- | --- | --- |
| 搭建 | 新建，链接安装，补丁含 `hmr` | 尚未启动 |
| 迭代 | 不变 | 构建后替换插件，进程不变 |
| 收尾 | 删除 | GUI 进程结束 |
