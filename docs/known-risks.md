# 已知风险

## 宿主版本

- `@deepseek-ai/dsh-*` 处于 rc 阶段，接口可能在版本间变化。
- 插件依赖的版本应与运行它的 DSH 版本一致；当前固定为 0.2.2-rc.3。
- 升级宿主后需要重新运行 `pnpm check` 与实机验证。

## 可选服务

- profile 未组合 `workspaceRegistry` 或 `sessionQuery` 时，对应工具组不注册。
- 模型看不到工具时，先检查 profile 组合层是否加载了对应服务。
- 服务晚到时工具组会补注册；服务卸载时整组释放。

## 同名工具冲突

- 本插件与 `@local/dsh-harness-tools` 注册同名工具，同一 profile 只能保留一个插件行。
- 同时启用时后者注册失败或覆盖，取决于加载顺序；安装本插件前先移除旧行。

## 标题读取

- `session_list` 默认读取本页最多 40 个会话的标题，每个标题都要读日志。
- 大历史下用 `titles: false` 或较小的 `limit`。
- 单个会话读取失败不会让整个列表失败，失败结果会被忽略；整批失败时附加 `note`。

## 工作区目录

- 目录被移动或删除时，注册记录仍在，`workspace_list` 返回 `status: missing-dir`。
- `workspace_remove` 不清理目录，也不删除会话日志。

## 严格配置

- 配置中出现未知键或非布尔值时，插件加载失败。
- 用户在 `cordis.patch.yml` 写错键名会导致插件停用。
- 用 `dsh --profile <profile> --dump-config` 检查最终配置。

## 前端

- 配置页依赖 `dsh-client-ui-plugin-manager` 与 `dsh-client-ui-settings`；宿主未加载这些包时配置页不出现。
- `PLATFORM_MODULES` 是宿主冻结模块表的副本；宿主升级后需要核对。
- 配置页键是 `<包名>#<行 id>`；包名或行 id 变化时两处都要改。
- 客户端依赖版本与宿主不一致时，槽位或 locale 服务可能不可用。

## 国际化

- 宿主在注册时捕获的文案（如命令描述）保持注册时的语言，切换语言后仍显示旧语言；槽位渲染的文案随切换更新。
- locale 服务只负责选择、持久化、语言匹配、键回退与 `<html lang>`；复数规则与双向布局由语言包自理。
- 元数据或字典缺当前语言时按回退链取值；缺 `meta.title` 与 `meta.description` 时回落 `package.json` 的字段，可能显示英文包名。
- 规范见 [i18n.md](./i18n.md)。

## Windows 长路径

`node_modules` 嵌套很深，路径可能超过 Windows 的 260 字符上限。

- `git worktree remove` 此时报错 `Filename too long`。
- `finish-worktree.sh` 遇到该错误时用 Node.js `rmSync` 删除目录，再运行 `git worktree prune`。
