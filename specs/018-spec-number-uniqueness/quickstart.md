# Quickstart: 协作场景的 spec 编号唯一性

## 前置条件

- 在 `worktrees/018-spec-number-uniqueness` 中执行。
- 已运行 `pnpm install`。
- 自动用例使用临时 bare origin，不需要访问 GitHub。

## 自动验证

```bash
pnpm test:code -- tests/worktree-extension.test.ts
```

覆盖：

- 创建时推送占号分支，`CLAIMED=true`。
- `--dry-run` 不占号、不建 worktree。
- 占号失败时无分支与 worktree 残留。
- 同号分支按字典序保留一个，另一个改号。
- 未 fetch 的远程分支参与算号。
- `check-spec-number.sh` 在唯一、远程同号、base 同号三种情况下返回 0/4/4。

## 场景 1：远程占号可见

1. 在临时裸仓库 `origin.git` 与克隆 `dev1` 中运行 `create-worktree.sh --json --short-name claimed`。
2. 检查输出 `CLAIMED=true`。
3. 运行 `git ls-remote --heads origin`，确认存在 `feat/<NNN>-claimed`。
4. 在第二个克隆 `dev2` 创建 spec，确认编号大于 `dev1` 的编号。

## 场景 2：未 fetch 也避让

1. 在 `dev2` 推送 `fix/002-other`。
2. 在未 fetch 的 `dev1` 运行 `create-worktree.sh --json --short-name fresh`。
3. 确认 `FEATURE_NUM=003`，远程同时存在 `fix/002-other` 与 `feat/003-fresh`。

## 场景 3：同号自动改号

1. 在 `dev2` 推送 `fix/002-alpha`。
2. 在 `dev1` 用 `--type fix --short-name zeta` 创建。
3. 确认 `FEATURE_NUM=003`，远程保留 `fix/002-alpha` 与 `fix/003-zeta`。
4. 换成 `--short-name alpha` 重试，确认保留 002。

## 场景 4：占号失败回滚

1. 把 `origin` 指向不存在的路径。
2. 运行 `create-worktree.sh --json --no-fetch --short-name offline`。
3. 确认退出码非 0，stderr 包含 `failed to push claim branch`。
4. 确认没有新分支与新 worktree 目录。

## 场景 5：交付前校验

1. 正常创建并进入 worktree，运行 `check-spec-number.sh --json`，确认退出 0、`UNIQUE=true`。
2. 在另一克隆推送同号分支，再运行一次，确认退出 4 且 `CONFLICTS` 列出该分支。
3. 在 base ref 放置同号 `specs/<NNN>-other/`，确认同样退出 4。

## 本仓库验收

在功能分支上运行：

```bash
.specify/extensions/worktree/scripts/bash/check-spec-number.sh --json
pnpm format && pnpm check
```

- 校验退出 0。
- 质量门禁通过。
- 远程存在 `fix/018-spec-number-uniqueness`，`main` 上没有 `specs/018-*` 的其他目录。
