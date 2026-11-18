# 开发

## 环境要求

- Node.js 24.9 及以上，与 DSH 的运行要求一致；CI 使用 Node 24。
- pnpm 11。

## 本地加载

1. 运行 `pnpm dev`，tsdown 监听 `src/` 并重建 `dist/index.mjs` 与 `dist/client.js`。
2. 在 profile 的 `cordis.patch.yml` 中加入：

```yaml
- insert:
    - id: dsh-plugin-meta-tools-dev
      name: file:///<repo>/dist/index.mjs
```

前端部分不需要额外的插件行。宿主读到包的 `dsh.client` 声明后加载 `dist/client.js`。改动前端代码后重建并刷新页面。

## 热更新

在同一文件启用 `hmr` 并监听 `dist`：

```yaml
- id: hmr
  disabled: false
  config:
    root: ["<repo>/dist"]
    ignored: ["**/node_modules"]
```

- 修改补丁后无需重启 DSH，运行中的 profile 会重新应用补丁。
- 插件行指向新路径时同时修改 `id`，确保宿主加载新路径的模块。
- 仓库路径含 `.dsh` 等点目录时，去掉默认的 `**/.*` 忽略规则。

## 前端构建

`tsdown.config.ts` 有两组构建：

| 构建组 | 入口 | 产物 |
| --- | --- | --- |
| 宿主 | `src/index.ts` | `dist/index.mjs` |
| 浏览器 | `src/client/index.ts` | `dist/client.js` |

- 浏览器组用 banner/footer/intro 包成 `window.__ModuleLoader__.load({ id, factory })` 闭包工厂。
- `PLATFORM_MODULES` 列出宿主冻结模块表提供的模块，构建时保持 external。
- 类型声明由 `tsc -p tsconfig.build.json` 生成到 `dist/`。

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 监听并构建 |
| `pnpm build` | 打包并生成类型声明 |
| `pnpm check` | 依次运行类型检查、lint 与测试 |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` | biome 检查 |
| `pnpm lint:fix` | biome 检查并自动修复 |
| `pnpm format` | biome 格式化 |
| `pnpm test` | 运行 vitest |
| `pnpm run release` | 检查并发布新版本 |

## 测试

| 文件 | 覆盖内容 |
| --- | --- |
| `tests/plugin.test.ts` | 入口契约、开关注册与注销、可选服务缺失与晚到、热重载 |
| `tests/config.test.ts` | 六个配置键的默认值、严格校验、冻结与实时读取 |
| `tests/workspace-tools.test.ts` | 四个工作区工具的成功、错误与渲染 |
| `tests/session-tools.test.ts` | 两个会话工具的筛选、分页、标题失败、截断与预算 |
| `tests/contract.test.ts` | 六个工具的名称、说明、参数与输出 schema |
| `tests/config-form.test.ts` | 配置页草稿、保存、恢复默认与卸载 |
| `tests/client.test.ts` | 字典键集与空文案、配置页槽位注册与渲染 |
| `tests/client-bundle.test.ts` | `dist/client.js` 的注册契约与导出 |
| `tests/package-pack.test.ts` | npm 包只含发布所需文件 |
| `tests/release-archive.test.mjs` | CHANGELOG 归档计划 |
| `tests/worktree-extension.test.ts` | worktree 扩展的创建、复用与清理 |
| `tests/helpers.ts` | 模拟宿主与客户端 `ctx`，记录注册、事件、服务与日志 |
| `tests/support/primitives.ts` | 把平台组件包解析到源码，避开已发布产物内联的依赖 |

浏览器用例由仓库内的 `playwright` 驱动无头 Chrome。`vitest.config.ts` 把 `@deepseek-ai/dsh-client-ui-primitives` 指向包的源码。

## Spec Kit 流程

DSH 从 `.dsh/skills/` 加载 `speckit-*` skill，在对话框输入 `/` 调用。

| 步骤 | 命令 | 产出 |
| --- | --- | --- |
| 1 | `/speckit-specify <需求描述>` | 分支、worktree 与 `spec.md` |
| 2 | `/speckit-clarify` | 写回 spec 的澄清结果 |
| 3 | `/speckit-plan` | `plan.md` 与设计产物 |
| 4 | `/speckit-tasks` | `tasks.md` |
| 5 | `/speckit-analyze` | 跨产物一致性报告 |
| 6 | `/speckit-implement` | 按阶段提交的实现 |
| 7 | `/speckit-worktree-finish` | 基线同步、PR、无上限等待合并与合并后的清理，或以 `abandon` 放弃 |

- `base_ref` 默认为 `origin/main`，必须已包含 `.specify/` 与 `.dsh/skills/`。
- `worktrees/` 已加入 `.gitignore`，biome 与 vitest 也会跳过它。

## 维护 worktree 扩展

扩展源码在 `.specify/extensions/worktree/`，`.dsh/skills/speckit-worktree-*` 由它渲染生成。

修改 `commands/` 或 `extension.yml` 后重新渲染：

1. 把扩展目录复制到仓库外的临时目录，删除其中的 `.specify-dev/`。
2. 运行 `specify extension add --dev <临时目录> --force`。

脚本行为由 `tests/worktree-extension.test.ts` 覆盖。

## 文件地图

```text
cordis.patch.yml            # 插件行，dsh plugin add 时插入 profile
locale/                     # 插件页标题、描述与详情
icon.svg                    # 插件图标
src/
├── index.ts                # 打包入口：name、inject、apply、Config 与工具组接线
├── config.ts               # 六个开关的 Config schema、默认值、严格校验与热重载读取
├── constants.ts            # 插件标识、工具名与结果上限
├── types.ts                # 宿主类型再导出与工作区/会话服务契约
├── utils.ts                # 对象判断、时间格式化、数值夹取与文本拼接
├── workspace-tools.ts      # 四个工作区工具与渲染
├── session-tools.ts        # 两个会话工具、标题读取与消息截断
└── client/
    ├── index.ts            # 浏览器入口：注册字典与配置页
    ├── config-form.ts      # 六个开关的草稿模型与行键
    ├── config-page.tsx     # 配置页的 summary 与 page 视图
    └── locales.ts          # 配置页中英文字典
dist/                       # 构建产物
scripts/release-archive.mjs # 发布时归档 CHANGELOG
tests/                      # vitest 单元测试
changelogs/                 # 各版本的 CHANGELOG 归档
docs/                       # 开发者文档
specs/<NNN>-<name>/         # 每个需求的 spec、plan、tasks
.dsh/skills/
└── speckit-*/              # Spec Kit 流程 skill
.specify/
├── memory/constitution.md  # 项目宪章
├── templates/              # Spec Kit 模板
├── scripts/bash/           # Spec Kit 脚本
├── extensions.yml          # 扩展钩子
└── extensions/worktree/    # 本地 worktree 扩展
.github/workflows/ci.yml    # CI：check 与 tag 触发的 publish
```
