# Changelog

## Unreleased

### Changed

- 实机测试改为链接安装并启用 HMR：构建后同一 GUI 实例自动替换插件，前后端都无需刷新或重启，每轮结束删除 profile
- `docs/development.md` 增加前端 UI 链接规则：`a` 标签的 `href` 使用完整 URL，相对链接在 Desktop 中打不开目标
