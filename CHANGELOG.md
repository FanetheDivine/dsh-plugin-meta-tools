# Changelog

## Unreleased

### Changed

- 两处消息投递改为 `Agent.steer` 插话，消息来源类型为 `dsh-plugin-meta-tools`，不再经会话 `prompt` 投递
- `session_send` 固定为插话：删除 `mode` 参数、`mode` 返回字段与 subagent 投递回退

### Added

- `@deepseek-ai/dsh-llm` 依赖：用 `createUserMessage` 构造完整插话消息