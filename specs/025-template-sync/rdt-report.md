# 实机核对：热更新实机流程

## 环境

- 宿主：`~/.dsh-local/dsh-0.2.2-rc.3`，与 `package.json` 的 `@deepseek-ai/dsh-agent` 一致。
- profile：`rdt-025`，用 `setup-env.sh` 链接安装，隔离配置停用真实模型。
- 浏览器：Playwright 驱动本机 headless Chrome，语言为中文。

## 结果

| 项目 | 结果 | 依据 |
| --- | --- | --- |
| 链接安装 | 通过 | `profile/node_modules/dsh-plugin-meta-tools` 为符号链接，指向仓库；profile 依赖为 `link:D:/...` |
| HMR 补丁 | 通过 | `cordis.patch.yml` 含 `- id: hmr` 与 `config.root: ["<仓库>/dist"]` |
| 插件装载 | 通过 | 插件页列出「元工具」，状态为运行中，来源显示 `link:` |
| 热更新 | 通过 | 在配置页把 `config.save` 改为「保存（热更新）」并 `pnpm build`，未刷新页面按钮文案更新；还原文案再构建后恢复 |
| 进程保持 | 通过 | GUI 进程号 28308 在两次构建前后不变 |
| profile 清理 | 通过 | 核对后删除 `~/.dsh/profiles/rdt-025` |

- 构建命令 `pnpm build` 同时更新 `dist/index.mjs` 与 `dist/client.js`，宿主按 HMR 替换后端插件、按轮询替换前端产物。
- 截图：`node_modules/.rdt-hot-before.png`、`node_modules/.rdt-hot-after.png`（核对时临时文件，已删除）。

## 未覆盖

- skill 的 B1–B5、C1、C3–C5 依赖模板的 `demo_echo`、`prefix` 与示例行，本插件已移除这些示例，按 `specs/013-template-sync/rdt-report.md` 的结论不适用。
- `browser-test.mjs` 仍按「查看/配置 `<包名>`」定位插件，当前宿主用元数据标题作为无障碍名称。本次用一次性脚本按标题定位，未改该文件。
