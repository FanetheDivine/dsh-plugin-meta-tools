# Quickstart: 模板转化为工作区与会话工具插件

## 前置

- Node.js >= 24.9，pnpm 11.7.0。
- 依赖已安装：`pnpm install --frozen-lockfile`。
- 宿主版本 0.2.2-rc.3。

## 本地校验

```sh
pnpm format
pnpm check
pnpm build
```

预期：

- 类型检查、lint 与全部测试通过。
- `dist/index.mjs`、`dist/client.js` 与类型声明生成。
- `tests/package-pack.test.ts` 确认发布内容含 `dist`、`cordis.patch.yml`、`README.md`、`locale/*.json` 与 `icon.svg`。

## 单元测试范围

| 文件 | 覆盖 |
| --- | --- |
| `tests/plugin.test.ts` | 六个配置键的默认值、严格校验、热重载、按开关注册与注销、可选服务缺失 |
| `tests/workspace-tools.test.ts` | 四个工作区工具的正常路径、错误、视图与渲染 |
| `tests/session-tools.test.ts` | 两个会话工具的筛选、分页、标题失败、截断与预算 |
| `tests/config-form.test.ts` | 六个开关的草稿、保存、放弃与恢复默认 |
| `tests/client.test.ts` | 字典、配置页注册与渲染 |
| `tests/package-pack.test.ts` | 发布内容与前端注册 id |

## 实机验证

使用 `real-device-test` skill 的流程，在独立测试 profile 中安装本地目录并启动宿主。

1. 构建后把仓库目录安装到测试 profile。
2. 新建会话，确认工具列表包含 `workspace_list`、`workspace_create`、`workspace_remove`、`workspace_rename`、`session_list`、`session_get`。
3. 依次调用 `workspace_list` → `workspace_create`（临时目录）→ `workspace_rename` → `workspace_remove`，核对返回与侧栏。
4. 调用 `session_list` 与 `session_get`，核对标题、状态、事件数与消息截断。
5. 打开“插件”页 → 本插件行详情 → 关闭 `session_get` 并保存；新请求不再包含该工具；重新打开后恢复。
6. 确认插件页显示标题、描述与图标，配置页文案随中英文切换。
7. 禁用插件行，确认六个工具从后续请求消失，已存工作区与会话不变。

## 发布设置核对

- `package.json` 的 `version` 为 `0.1.0`。
- `.github/workflows/ci.yml` 的 `publish` 任务由 tag 触发。
- `specs/` 只保留 `012-meta-tools`，`changelogs/` 为空，`CHANGELOG.md` 只有标题。
- 提醒用户把 npm Trusted Publisher 绑定到本仓库与 `.github/workflows/ci.yml`。