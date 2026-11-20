# Quickstart: 同步模板热更新实机流程与前端链接规则

**Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## 前置

1. 仓库已安装依赖并构建：`pnpm i && pnpm check`。
2. 宿主版本为 `0.2.2-rc.3`，或脚本可安装到 `~/.dsh-local`。
3. 本机 Chrome 可用，`playwright` 已安装。

## 搭建与检查

```sh
bash .dsh/skills/real-device-test/scripts/setup-env.sh <仓库绝对路径> rdt-025
```

预期：

- `~/.dsh/profiles/rdt-025/node_modules/dsh-plugin-meta-tools` 指向仓库。
- 补丁含 `- id: hmr` 与 `config.root: ["<仓库>/dist"]`。
- 结尾提示写明构建后自动生效与删除 profile。

复用旧 profile 时再次运行脚本，确认缺 `hmr` 时补齐，其余条目不变。

## 热更新验证

1. 记录 GUI 进程号：`netstat -ano | grep ":3210 " | grep LISTENING`。
2. 修改 `src/client/locales.ts` 的配置页文案，例如「保存」改为「保存（热更新）」。
3. 构建：`pnpm build`。
4. 在已打开的插件配置页观察文案变化，页面不刷新。
5. 预期：文案为新值；GUI 进程号不变；插件仍激活；会话可继续。
6. 还原文案改动。

## 收尾

1. 写报告并保存截图，含「热更新验证」一节。
2. 结束 GUI：`taskkill //F //T //PID <pid>`。
3. 删除 profile：`rm -rf ~/.dsh/profiles/rdt-025`。

## 文档校验

- `docs/development.md` 的「前端构建」之后能读到「前端 UI 链接」，含完整 URL 要求、示例与原因。
- `CHANGELOG.md` 的 `Unreleased`/`Changed` 含实机热更新与前端链接规则两条。

## 失败排查

- 构建后行为不变：确认插件为链接安装、补丁含 `hmr`、`dist/index.mjs` 已更新。
- 仓库路径含点目录：去掉 `**/.*` 忽略规则，或把仓库移到不含点目录的路径。
