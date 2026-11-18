# Quickstart: 模板文档同步

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
5. 阅读 `docs/development.md` 的 Spec Kit 流程表。
   - 流程产出与当前扩展行为一致，不含自动同步 `main` 的声明。

## 自动验证

```bash
git diff --check
pnpm format && pnpm check
```

预期两条命令退出码均为 0。
