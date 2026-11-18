# Contract: check-spec-number.sh

交付前校验当前分支的 spec 编号是否唯一。

## 调用

```bash
.specify/extensions/worktree/scripts/bash/check-spec-number.sh \
  [--json] [--branch NAME] [--base-ref REF]
```

## 参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `--json` | 关 | 输出单行 JSON；关闭时输出 `KEY=VALUE` |
| `--branch` | 当前分支 | 被校验的分支 |
| `--base-ref` | `origin/main` | 提供已合并 spec 目录的引用 |

## 输出

| 字段 | 说明 |
| --- | --- |
| `BRANCH` | 被校验的分支 |
| `FEATURE_NUM` | 分支名末段的数字前缀 |
| `UNIQUE` | 是否唯一 |
| `SKIPPED` | 分支名没有数字前缀时为 `true` |
| `CONFLICTS` | JSON 中为逗号分隔字符串，`KEY=VALUE` 中每项一行 |

## 校验来源

| 来源 | 判定 |
| --- | --- |
| 远程同号分支 | 分支名末段以 `<NNN>-` 开头，且不等于被校验分支 |
| base ref 的同号 spec 目录 | `specs/<NNN>-*`，且不等于被校验分支的目录 |

## 退出码

| 码 | 含义 |
| --- | --- |
| 0 | 唯一，或分支名没有编号而跳过 |
| 4 | 发现冲突，输出 `CONFLICTS` |
| 1 | 参数错误、detached HEAD、fetch 失败或远程不可达 |

## 行为

1. 解析分支名，无三位以上数字前缀时输出 `SKIPPED=true` 并退出 0。
2. 解析 base ref 的远程与分支；远程存在时只 fetch 该分支。
3. 查询 `origin` 全部 head，收集同号分支。
4. 读取 base ref 的 `specs/`，收集同号目录。
5. 无冲突输出 `UNIQUE=true` 并退出 0；有冲突输出 `UNIQUE=false` 并退出 4。
