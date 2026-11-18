# Research: 模板流程同步

## R1 宪章原则

**Decision**: 保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则，版本为 `2.0.0`。

**Rationale**: 这五条是跨需求的硬约束。宿主依赖版本原则采用同版本 `@deepseek-ai/dsh` 作为唯一依据，并明确 `dsh-*` 的确切版本与 `minimumReleaseAgeExclude`。

**Alternatives considered**: 保留九条原则会持续混合硬约束与实现规则；直接复制模板原则会遗漏本项目的工具契约迁移。

## R2 规则归属

**Decision**: 宿主契约、依赖归属、严格配置与工具契约归 `docs/how-it-works.md`，国际化归 `docs/i18n.md`。

**Rationale**: 这些文档分别承载工作机制与国际化规范。工具契约属于插件工作机制，当前数量为十一个，回归基准为 `tests/contract.test.ts`。

**Alternatives considered**: 新增工具契约文档会增加归属层级；新增模板转化文档不适用于实际插件。

## R3 主工作区同步

**Decision**: 新增独立脚本 `sync-main.sh`，由扩展命令在创建前与清理后各调用一次。

- 主工作区取 `git worktree list --porcelain` 的第一项。
- 先检查主工作区位于 `main` 且 `git status --porcelain` 为空。
- 运行 `git fetch origin main`，确认本地 `main` 是 `origin/main` 的祖先。
- 本地落后时运行 `git pull --ff-only origin main`。
- 退出码 0 表示已同步，2 表示主工作区不满足约束，1 表示其他错误。
- 脚本逻辑包在函数中，`main "$@"; exit $?` 写在同一行。
- 手工同步扩展命令正文与对应 skill，保留 skill front matter。

**Rationale**: `--ff-only` 不产生合并提交，不改写本地提交。独立脚本先运行完毕，`create-worktree.sh` 再以更新后的版本启动；`finish-worktree.sh` 在同步前已经结束。函数与单行调用让 bash 在执行前完整解析脚本，避免 `git pull` 改写脚本后读到错位内容。

**Alternatives considered**: `git merge --ff-only` 违反主工作区只允许 fetch 与 pull 的约束；`git reset --hard` 会丢弃本地提交；在创建或清理脚本内部同步会在 pull 后继续读取被改写的脚本。

## R4 编号引用

**Decision**: 更新现行文档、worktree 扩展命令与对应 skill 的原则编号。历史 `specs/` 与已有 CHANGELOG 条目保持原样。

**Rationale**: 当前引用需要可解析，历史产物记录当时语境。

**Alternatives considered**: 全仓批量替换会改写历史；只改 `docs/` 会遗漏 worktree finish 的文档结构原则引用。
