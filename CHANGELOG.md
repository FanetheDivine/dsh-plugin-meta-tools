# Changelog

## Unreleased

### Added

- 配置页“新增会话”区域把“默认模型”改为“模型”，并在下方增加“预设”行；可通过宿主 Menu 选择新建会话的默认预设
- `session_create` 未显式传预设时使用插件默认预设；预设不在宿主可用名册时回退宿主默认

### Changed

- 升级全部 `@deepseek-ai/dsh-*` 依赖到 0.2.2-rc.5，新增 `@deepseek-ai/dsh-agent-preset-registry`
- 实机测试改为链接安装并启用 HMR：构建后同一 GUI 实例自动替换插件，前后端都无需刷新或重启，每轮结束删除 profile
- `docs/development.md` 增加前端 UI 链接规则：`a` 标签的 `href` 使用完整 URL，相对链接在 Desktop 中打不开目标
