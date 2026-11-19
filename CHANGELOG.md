# Changelog

## Unreleased

### Changed

- 插件标题改为“元工具”与“Meta tools”，描述说明 AI 借此修改自身运行环境
- 图标改为扳手加环绕箭头，无底板
- README 改写为面向用户的说明；安装命令移入 `docs/development.md`，工具一览、配置键与日志目录移入 `docs/how-it-works.md`
- 配置页按工作区、查看会话、管理会话分组；每项显示工具名、功能名称、说明与竖直对齐的开关
- 两处消息投递改为 `Agent.steer` 插话，消息来源类型为 `dsh-plugin-meta-tools`，不再经会话 `prompt` 投递
- `session_send` 固定为插话：删除 `mode` 参数、`mode` 返回字段与 subagent 投递回退

### Added

- `session_create` 支持 provider/model/effort，并可在插件配置页保存默认模型
- 配置页复用官方模型与推理等级选择器，模型名前显示 provider，不显示团队协作配置项
- `@deepseek-ai/dsh-llm` 依赖：用 `createUserMessage` 构造完整插话消息
