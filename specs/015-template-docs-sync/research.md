# Research: 模板文档同步

## R1 宪章原则

**Decision**: 保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则，版本为 `2.0.0`。

**Rationale**: 这五条是跨需求的硬约束。宿主依赖版本原则采用同版本 `@deepseek-ai/dsh` 作为唯一依据，并明确 `dsh-*` 的确切版本与 `minimumReleaseAgeExclude`。

**Alternatives considered**: 保留九条原则会持续混合硬约束与实现规则；直接复制模板原则会遗漏本项目的工具契约迁移。

## R2 规则归属

**Decision**: 宿主契约、依赖归属、严格配置与工具契约归 `docs/how-it-works.md`，国际化归 `docs/i18n.md`。

**Rationale**: 这些文档分别承载工作机制与国际化规范。工具契约属于插件工作机制，当前数量为十一个，回归基准为 `tests/contract.test.ts`。

**Alternatives considered**: 新增工具契约文档会增加归属层级；新增模板转化文档不适用于实际插件。

## R3 主工作区同步范围

**Decision**: `AGENTS.md` 写明主工作区位于 `main`、保持干净、只运行 `git fetch` 与 `git pull`，所有变更在 worktree 中进行。`docs/development.md` 保持当前扩展行为。

**Rationale**: 用户要求修订 spec 与文档。当前扩展没有自动同步脚本，文档不声明该能力已经存在。

**Alternatives considered**: 同步模板中的自动同步脚本与测试超出本次文档范围；只复制流程表会错误描述当前行为。

## R4 编号引用

**Decision**: 更新现行文档、worktree 扩展命令与对应 skill 的原则编号。历史 `specs/` 与已有 CHANGELOG 条目保持原样。

**Rationale**: 当前引用需要可解析，历史产物记录当时语境。

**Alternatives considered**: 全仓批量替换会改写历史；只改 `docs/` 会遗漏 worktree finish 的文档结构原则引用。
