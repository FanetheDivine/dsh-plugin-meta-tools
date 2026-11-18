# Changelog

## Unreleased

### Added

- 十一个工具：`workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename`、`session_list`、`session_get`、`session_create`、`session_stop`、`session_send`、`session_pin` 与 `session_archive`
- `session_list` 按标题子串查询，排除调用方会话，subagent 归并到主会话
- `session_get` 把主会话与 subagent 日志写成 JSONL 到系统临时目录
- `session_send` 以 `<system-reminder>` 帧投递消息
- 插件面板十一个以工具名命名的开关，保存后热重载
- 插件页标题、描述、详情与图标
- `tests/metadata.test.ts`：元数据结构、键集、禁用字符与清单声明
- `docs/i18n.md`：元数据资源与前端字典的国际化规范
- `tests/support/dist-freshness.ts` 与 `tests/dist-freshness.test.ts`：产物新鲜度判定

### Changed

- `session_get` 改为返回临时目录与文件路径，移除 `messages` 参数与消息列表
- 插件页标题、描述与开关标签按新能力改写，工具标题合并为单行标签
- 工具说明与文档去掉 `profile`
- 仓库转化为 `dsh-plugin-meta-tools`：移除模板示例与前端示例行
- 宪章升级到 1.11.0：进包清单补 `locale/*.json` 与 `icon.svg`，合并门禁改为 `pnpm full-check`，原则 IX 增加元数据条款
- 测试脚本拆分为 `test:code` 与 `test:dist`，移除 `test`；`pnpm check` 只运行源码测试
- `pnpm build` 在生成产物与类型声明后运行 `test:dist`
- 产物缺失或过期时产物测试失败，提示运行 `pnpm build`
- CI 的发布任务恢复 tag 触发，版本改为 0.1.0
- 宪章升级到 2.0.0，只保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则
- 宿主契约、依赖归属、严格配置与工具契约归入 `docs/how-it-works.md`，国际化约束归入 `docs/i18n.md`
- `AGENTS.md` 新增主工作区约束：主工作区位于 `main` 且干净，只运行 `git fetch` 与 `git pull`，任何变更在 worktree 中进行
