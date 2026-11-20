# Research: 同步模板热更新实机流程与前端链接规则

**Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## R1 模板热更新的机制

- 决定：采用模板 `fe93cd0` 的做法：profile 用 `dsh plugin add <仓库路径>` 链接安装，`cordis.patch.yml` 增加 `- id: hmr`，`config.root` 指向仓库 `dist`。
- 理由：`@deepseek-ai/dsh-hmr` 替换「链接包的目标文件」，`node_modules` 下的安装副本不因文件变化重载；`@deepseek-ai/dsh-client-hmr` 轮询客户端产物，页面无需刷新。
- 备选：继续用 `pnpm pack` 安装，靠重装并重启宿主。被否，迭代成本高且中断会话。

## R2 本项目的 profile 现状

- 决定：把 `setup-env.sh` 第 4 步的 tgz 安装换成链接安装，删除 tgz 变量。
- 理由：现有脚本第 4 步用 `pnpm pack` 生成 tgz 再 `dsh plugin add`；仓库根 `cordis.patch.yml` 只声明插件行，没有 `hmr`。
- 备选：只改文档、不动脚本。被否，profile 仍加载旧产物，热更新不成立。

## R3 装载用例与链接安装

- 决定：保留 A1 的版本与哈希断言，只把「已安装」改为「加载的」。
- 理由：链接安装下 `profile/node_modules/<插件>` 指向仓库，`join(root, 'node_modules', PLUGIN)` 读到的就是仓库产物，断言继续成立；用户可见文案不再暗示安装副本。
- 备选：删掉 A1 的哈希断言。被否，会掩盖加载旧产物。

## R4 已有 profile 的兼容

- 决定：复用已有补丁且缺 `hmr` 条目时补齐；先删除孤立的 `[]` 占位行；skill 要求每轮结束删除 profile。
- 理由：模板只在「`rdt-mock` 已存在」的分支补 HMR，旧补丁可能只有 `[]`，直接追加会得到非法 YAML 列表。
- 备选：拒绝旧 profile。被否，补齐逻辑成本低，且删除 profile 在轮次结束时统一处理。

## R5 热更新验证的观察点

- 决定：改 `src/client/locales.ts` 的配置页文案（例如保存按钮），构建后在已打开的插件配置页观察，页面不刷新；记录 GUI 进程号不变。
- 理由：本插件没有示例工具，mock provider 只调用 `demo_echo`，无法通过会话看到工具卡片；配置页文案在 GUI 中直接可见，且能验证前端产物替换与后端插件重新激活。
- 备选：扩展 mock provider 调用真实工具。被否，超出本次范围（D-002）。

## R6 模板遗留用例

- 决定：B1–B5、C1、C3–C5 的 `demo_echo`、`prefix`、`demoEnabled` 引用保持原状，不在本次适配。
- 理由：`specs/013-template-sync/rdt-report.md` 已记录这些用例对本插件不适用。
- 备选：本次一并适配。被否，用户要求只加热更新能力。

## R7 点目录与 HMR

- 决定：在 `pitfalls.md` 记录「仓库路径含点目录时监听不到，需去掉 `**/.*` 忽略规则」。
- 理由：HMR 默认忽略点目录，本仓库路径不含点目录，但用户可能把仓库放在 `.worktrees` 等目录下。

## R8 前端链接规则

- 决定：在 `docs/development.md` 的「前端构建」后新增「前端 UI 链接」，示例 URL 用 `https://github.com/FanetheDivine/dsh-plugin-meta-tools`。
- 理由：Desktop 用应用内地址加载前端页面，相对 `href` 指向应用地址；示例用本项目仓库地址，读者可直接核对。
- 备选：只在 skill 中说明。被否，规则属于开发文档。
