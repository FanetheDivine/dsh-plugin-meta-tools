# Changelog

## Unreleased

### Added

- 六个工具：`workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename`、`session_list` 与 `session_get`
- 插件面板六个以工具名命名的开关，保存后热重载
- 插件页标题、描述、详情与图标
- `tests/metadata.test.ts`：元数据结构、键集、禁用字符与清单声明
- `docs/i18n.md`：元数据资源与前端字典的国际化规范
- `tests/support/dist-freshness.ts` 与 `tests/dist-freshness.test.ts`：产物新鲜度判定

### Changed

- 仓库转化为 `dsh-plugin-meta-tools`：移除模板示例与前端示例行
- 宪章升级到 1.11.0：进包清单补 `locale/*.json` 与 `icon.svg`，合并门禁改为 `pnpm full-check`，原则 IX 增加元数据条款
- 测试脚本拆分为 `test:code` 与 `test:dist`，移除 `test`；`pnpm check` 只运行源码测试
- `pnpm build` 在生成产物与类型声明后运行 `test:dist`
- 产物缺失或过期时产物测试失败，提示运行 `pnpm build`
- CI 的发布任务恢复 tag 触发，版本改为 0.1.0
