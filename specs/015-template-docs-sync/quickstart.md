# Quickstart: 模板流程同步

## 前置条件

- 位于 `worktrees/015-template-docs-sync`。
- 已安装项目依赖。

## 文档验证

1. 阅读 `.specify/memory/constitution.md`。
   - 原则依次为宿主依赖版本、测试同步、文档结构、质量门禁、公开引用。
   - 版本为 `2.0.0`。
2. 按 [data-model.md](./data-model.md) 逐行检查归属文档。
   - 每条规则只在一个归属文档完整出现。
   - `docs/how-it-works.md` 写明当前十一个工具的契约规则。
3. 阅读 `AGENTS.md` 的「主工作区」。
   - 能回答分支、清洁状态、允许操作与变更位置。
4. 检索现行文档、`.dsh/skills/` 与 `.specify/extensions/` 的原则编号。
   - 测试同步引用原则 II。
   - 文档结构引用原则 III。
   - 国际化与工具契约引用各自归属文档。
   - 历史 `specs/012-*` 至 `specs/014-*` 保持原样。
5. 阅读两份 worktree 命令与对应 skill。
   - `/speckit-worktree-create` 在创建 worktree 前运行 `sync-main.sh`，失败时停止。
   - `/speckit-worktree-finish` 在两种模式的清理后运行 `sync-main.sh`，失败时报告原因。
   - skill 去掉 front matter 后与对应命令正文一致。
6. 阅读 `docs/development.md` 的 Spec Kit 流程表。
   - 第 1 步包含创建前同步主工作区。
   - 第 7 步包含清理后同步主工作区。

## 自动验证

```bash
git diff --check
pnpm format && pnpm full-check
```

`tests/sync-main.test.ts` 覆盖 [contracts/sync-main.md](./contracts/sync-main.md) 的全部退出码与以下场景：

| 场景 | 预期 |
| --- | --- |
| 本地 `main` 落后 | 退出 0，`UPDATED=true`，`MAIN_COMMIT` 等于 `origin/main` |
| 已同步 | 退出 0，`UPDATED=false` |
| 只有被忽略的文件 | 退出 0 |
| 在 feature worktree 内运行 | 主工作区被同步 |
| 不在 `main` | 退出 2，主工作区不变 |
| 有未跟踪文件 | 退出 2，主工作区不变 |
| 本地 `main` 有额外提交 | 退出 2，本地提交保留 |
| origin 不可达 | 退出 1 |
| 脚本在执行中被 `git pull` 改写 | 退出 0，输出来自原脚本 |

预期命令退出码均为 0。

## 手工验证

在主工作区运行：

```bash
.specify/extensions/worktree/scripts/bash/sync-main.sh --json
```

预期退出 0，`MAIN_COMMIT` 等于 `git rev-parse origin/main`。
