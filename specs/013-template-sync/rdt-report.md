# 实机核对：插件元数据

## 环境

- 宿主：`~/.dsh-local/dsh-0.2.2-rc.3`，与 `package.json` 的 `@deepseek-ai/dsh-agent` 版本一致。
- profile：`rdt-013-template-sync`，用 `pnpm pack` 的 tarball 安装插件，隔离配置停用真实模型。
- 浏览器：Playwright 驱动本机 Chrome，每轮新建上下文，分别指定 `zh-CN` 与 `en-US`。

## 结果

| 用例 | 场景 | 结果 |
| --- | --- | --- |
| A1 | 插件装载，已安装版本 0.1.0，`dist` 哈希与仓库一致 | 通过 |
| M1 | `zh-CN` 打开插件页 | 标题「工作区与会话工具」，描述为中文全文，通过 |
| M2 | `en-US` 打开插件页 | 标题 `Workspace and session tools`，描述为英文全文，通过 |
| M3 | 关闭启用开关并刷新页面，开关为关后查看插件行 | 标题与描述照常显示，通过 |

- M1 与 M2 未出现另一种语言的标题，按语言取资源文件生效。
- M3 的开关在刷新后读为 `aria-checked=false`，插件行仍显示元数据，与「停用状态照常读取」一致。

## 未覆盖

- 设置页 Language 切换后的即时刷新：两轮分别来自两个新上下文，未在同一页面切换。
- 详情页正文：未声明 `meta.detail`，详情页使用 `README.md`，本次未打开核对。
- 仓库的 `run-test.mjs` 与 `browser-test.mjs` 用例面向模板的 `demo_echo` 与示例行；本插件已移除这两个示例，B1–B5 与 C1、C3–C5 不适用。B 用例写入 `prefix` 配置会被严格校验拒绝，核对时只运行 A1 与上述元数据用例。
- 截图保存在 profile 的 `shots-013/`，核对后删除临时脚本，保留 profile 与截图供复查。
