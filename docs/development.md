# 开发

## 环境要求

- Node.js 24.9 及以上，与 DSH 的运行要求一致；CI 使用 Node 24。
- pnpm 11。

## 安装

```sh
dsh plugin add dsh-plugin-meta-tools
```

- 也可以安装本地目录：`dsh plugin add <插件目录>`。
- 本插件与 `@local/dsh-harness-tools` 注册同名工具，安装前先移除后者的插件行，原因见 [known-risks.md](./known-risks.md#同名工具冲突)。

## 本地加载

1. 运行 `pnpm dev`，tsdown 监听 `src/` 并重建 `dist/index.mjs` 与 `dist/client.js`。
2. 在 `cordis.patch.yml` 中加入：

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

- 修改补丁后无需重启 DSH，运行中的实例会重新应用补丁。
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

## 前端 UI 链接

前端 UI 里 `a` 标签的 `href` MUST 使用完整 URL：

- 完整 URL 含协议与主机，例如 `https://github.com/FanetheDivine/dsh-plugin-meta-tools`。
- Desktop 用应用内地址加载前端页面。`href` 写成相对路径时，点击后指向应用地址，打不开目标。

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 监听并构建 |
| `pnpm build` | 打包、生成类型声明并运行 `test:dist` |
| `pnpm check` | 依次运行类型检查、lint 和 `test:code` |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` | biome 检查 |
| `pnpm lint:fix` | biome 检查并自动修复 |
| `pnpm format` | biome 格式化 |
| `pnpm test:code` | 只运行源码测试 |
| `pnpm test:dist` | 只运行产物测试，要求 `dist` 新鲜 |
| `pnpm run release` | 检查并发布新版本 |

代码质量门禁是 `pnpm full-check`；`pnpm check`、`test:code` 与 `test:dist` 用于局部验证。

## CI

`.github/workflows/ci.yml` 有两个 job：

| Job | 触发 | 内容 |
| --- | --- | --- |
| `check` | PR、打 tag | Node 24 上运行 `pnpm run full-check` |
| `publish` | 打 tag | 构建后发布 npm，用 OIDC 换取发布令牌 |

- `full-check` 依次运行 `check` 与 `build`：`check` 不读取 `dist`，产物测试在 `build` 末尾执行。

## 测试

| 文件 | 覆盖内容 |
| --- | --- |
| `tests/plugin.test.ts` | 入口契约、开关注册与注销、可选服务缺失与晚到、热重载 |
| `tests/config.test.ts` | 十一个配置键的默认值、严格校验、冻结与实时读取 |
| `tests/workspace-tools.test.ts` | 四个工作区工具的成功、错误与渲染 |
| `tests/session-tools.test.ts` | `session_list` 的筛选、分页、标题查询、调用方排除与 subagent 归并 |
| `tests/session-log.test.ts` | `session_get` 的会话树、JSONL 内容、临时目录与落盘屏障 |
| `tests/session-ops.test.ts` | 新建、停止、发送提醒、置顶与归档 |
| `tests/contract.test.ts` | 十一个工具的名称、说明、参数与输出 schema |
| `tests/config-form.test.ts` | 配置页草稿、保存、恢复默认与卸载 |
| `tests/model-defaults.test.ts` | 默认模型目录、草稿选择、错误状态与卸载 |
| `tests/client.test.ts` | 字典键集与空文案、配置页槽位注册与渲染 |
| `tests/client-bundle.test.ts` | `dist/client.js` 的注册契约与导出（产物测试） |
| `tests/package-pack.test.ts` | npm 包只含发布所需文件，含前端产物与元数据资源（产物测试） |
| `tests/metadata.test.ts` | 插件元数据的结构、键集、禁用字符与清单声明 |
| `tests/dist-freshness.test.ts` | 产物新鲜度判定的四种状态 |
| `tests/release-archive.test.mjs` | CHANGELOG 归档计划 |
| `tests/worktree-extension.test.ts` | worktree 扩展的创建、占号、改号、编号校验、复用与清理 |
| `tests/sync-main.test.ts` | 主工作区 `main` 快进到 `origin/main`，不满足约束时保持原样 |
| `tests/helpers.ts` | 模拟宿主与客户端 `ctx`，记录注册、事件、服务与日志 |
| `tests/support/primitives.ts` | 把平台组件包解析到源码，避开已发布产物内联的依赖 |
| `tests/support/dist-freshness.ts` | 产物新鲜度检查，产物缺失或过期时提示运行 `pnpm build` |

测试要求见[宪章](../.specify/memory/constitution.md)原则 II。文案与元数据的规范见 [i18n.md](./i18n.md)。

vitest 拆成 `code` 与 `dist` 两个 project。产物测试读取 `dist`，由 `build` 末尾的 `test:dist` 执行；`test:code` 不读取 `dist`。产物缺失或早于构建输入时，产物测试失败并提示运行 `pnpm build`。

纯文档流程变更不新增测试文件时，仍须运行质量门禁。专项验收步骤记录在对应 spec 的 `quickstart.md`。

浏览器用例由仓库内的 `playwright` 驱动无头 Chrome。`vitest.config.ts` 把 `@deepseek-ai/dsh-client-ui-primitives` 指向包的源码。

## Spec Kit 流程

DSH 从 `.dsh/skills/` 加载 `speckit-*` skill，在对话框输入 `/` 调用。

| 步骤 | 命令 | 产出 |
| --- | --- | --- |
| 1 | `/speckit-specify <需求描述>` | 主工作区 `main` 同步到 `origin/main`，占号分支、worktree、规格草稿与待确认决策 |
| 2 | `/speckit-clarify` | 探索结果、分批访谈记录、更新后的 spec，以及完整规格的 `Approved` 或 `Waived` 审查记录 |
| 3 | `/speckit-plan` | `plan.md` 与设计产物、实现细节访谈记录，以及完整计划的 `Approved` 或 `Waived` 审查记录 |
| 4 | `/speckit-tasks` | 通过规格与计划门禁后生成的 `tasks.md` |
| 5 | `/speckit-analyze` | 跨产物一致性报告 |
| 6 | `/speckit-implement` | 复核门禁并按阶段提交的实现；新未决项返回对应访谈 |
| 7 | `/speckit-worktree-finish` | 基线同步、编号校验、PR、无上限等待合并与合并后的清理，或以 `abandon` 放弃；清理后主工作区 `main` 同步到 `origin/main` |

- `base_ref` 默认为 `origin/main`，必须已包含 `.specify/` 与 `.dsh/skills/`。
- 创建 spec 时，`create-worktree.sh` 先同步远程全部分支，再推送 `<type>/<NNN>-<name>` 占号，最后创建 worktree。
- 同号分支按完整分支名排序，保留第一个，其余自动改号；占号失败时中止，不留下分支与 worktree。
- `/speckit-worktree-finish` 在推送与 PR 前运行 `check-spec-number.sh`，发现同号时停止。
- `worktrees/` 已加入 `.gitignore`，biome 与 vitest 也会跳过它。

## 维护 Spec Kit 核心流程

核心 `.dsh/skills/speckit-*/SKILL.md` 由 Spec Kit integration 生成，仓库没有对应的本地命令渲染源。修改这些文件时：

1. 保留 front matter。
2. 更新 `.specify/integrations/dsh.manifest.json` 中被修改 skill 的 SHA-256。
3. 修改 `.specify/templates/` 或 `.specify/scripts/` 时，同步更新 `.specify/integrations/speckit.manifest.json` 中对应条目。
4. 上游 Spec Kit 刷新后重新审查并应用本地流程定制。

可用以下命令计算候选文件哈希，再仅更新实际修改的 manifest 条目：

```sh
sha256sum .dsh/skills/speckit-*/SKILL.md .specify/templates/*.md
```

spec 与 plan 模板包含状态、待确认决策、澄清记录和审查记录。访谈与审查的完整执行规则归属对应 skill：

- [speckit-clarify](../.dsh/skills/speckit-clarify/SKILL.md)：需求探索、分批需求访谈与完整规格审查。
- [speckit-plan](../.dsh/skills/speckit-plan/SKILL.md)：技术探索、分批实现细节访谈与完整计划审查。
- [speckit-tasks](../.dsh/skills/speckit-tasks/SKILL.md)：任务生成前的规格与计划门禁。
- [speckit-implement](../.dsh/skills/speckit-implement/SKILL.md)：实现前复核与新未决项处理。

## 维护 worktree 扩展

扩展源码在 `.specify/extensions/worktree/`，`.dsh/skills/speckit-worktree-*` 由它渲染生成。

修改 `commands/` 或 `extension.yml` 后重新渲染：

1. 把扩展目录复制到仓库外的临时目录，删除其中的 `.specify-dev/`。
2. 运行 `specify extension add --dev <临时目录> --force`。

脚本行为由 `tests/worktree-extension.test.ts` 与 `tests/sync-main.test.ts` 覆盖。

- `scripts/bash/spec-number-lib.sh`：编号解析与同号分支匹配。
- `scripts/bash/check-spec-number.sh`：交付前的编号唯一性校验。
- 修改 `commands/` 后同步 `.dsh/skills/speckit-worktree-*/SKILL.md` 的正文，保留 front matter。

## 文件地图

```text
cordis.patch.yml            # 插件行，dsh plugin add 时插入
locale/                     # 插件页标题、描述与详情
icon.svg                    # 插件图标
src/
├── index.ts                # 打包入口：name、inject、apply、Config 与工具组接线
├── config.ts               # 十一个开关的 Config schema、默认值、严格校验与热重载读取
├── constants.ts            # 插件标识、工具名、能力分组与结果上限
├── types.ts                # 宿主类型再导出与工作区/会话服务契约
├── utils.ts                # 对象判断、时间格式化与数值夹取
├── workspace-tools.ts      # 四个工作区工具与渲染
├── session-tools.ts        # session_list：查询、归并、调用方排除
├── session-log.ts          # session_get：会话树、JSONL 与临时目录
├── session-ops.ts          # 新建、停止、发送、置顶与归档
└── client/
    ├── index.ts            # 浏览器入口：注册字典与配置页
    ├── config-form.ts      # 十一个开关的草稿模型与行键
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
├── templates/              # Spec Kit 产物模板与审查区块
├── integrations/           # 受管 skill、脚本与模板的 SHA-256 清单
├── scripts/bash/           # Spec Kit 脚本
├── extensions.yml          # 扩展钩子
└── extensions/worktree/    # 本地 worktree 扩展
.github/workflows/ci.yml    # CI：check 与 tag 触发的 publish
```
