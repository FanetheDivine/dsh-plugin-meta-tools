# Contract: create-worktree.sh

创建带编号的功能分支与嵌套 worktree，并在远程占号。

## 调用

```bash
.specify/extensions/worktree/scripts/bash/create-worktree.sh \
  [--json] [--dry-run] [--no-fetch] [--base-ref REF] \
  [--type TYPE] --short-name NAME
```

## 参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `--json` | 关 | 输出单行 JSON；关闭时输出 `KEY=VALUE` |
| `--dry-run` | 关 | 只计算编号与路径，不建分支、不推送、不建 worktree |
| `--no-fetch` | 关 | 跳过远程同步，占号后仍查询远程校验同号 |
| `--base-ref` | 配置文件或 `origin/main` | 分支起点 |
| `--type` | `feat` | 小写字母分支类型 |
| `--short-name` | 必填 | 2-4 个词的短名，脚本转为 kebab-case |

## 输出

| 字段 | 说明 |
| --- | --- |
| `BRANCH_NAME` | `<type>/<NNN>-<slug>` |
| `FEATURE_NUM` | 三位编号 |
| `FEATURE_NAME` | `<NNN>-<slug>` |
| `FEATURE_DIRECTORY` | `specs/<NNN>-<slug>` |
| `WORKTREE_PATH` | `<主工作区>/worktrees/<NNN>-<slug>` |
| `MAIN_WORKTREE` | 主工作区绝对路径 |
| `BASE_REF` | 实际使用的起点 |
| `CREATED` | 是否创建了 worktree |
| `IN_WORKTREE` | 是否复用了当前 feature worktree |
| `CLAIMED` | 本次是否成功在远程占号 |

## 行为

1. 解析分支类型、短名与起点。
2. 未指定 `--no-fetch` 时同步 `origin` 全部 head，并清理失效引用。
3. 从远程分支、base ref 的 spec 目录、本地分支与主工作区 spec 目录取最大编号，加一作为候选。
4. `--dry-run` 输出候选编号后结束。
5. 从候选编号起创建本地分支并推送到 `origin` 占号。
6. 重新查询远程，按完整分支名排序检查同号分支。本分支不是排序第一个时删除占号、按当前最大编号加一后重试，最多 10 次。
7. 在与主工作区并列的 `worktrees/<NNN>-<slug>` 创建 worktree。
8. 输出结果。

## 失败与回滚

| 场景 | 退出码 | 结果 |
| --- | --- | --- |
| 参数缺失或非法 | 1 | 不修改仓库 |
| base ref 不存在或不含 `.specify/` | 1 | 不修改仓库 |
| 同步失败 | 1 | 不创建分支 |
| 占号推送失败 | 1 | 删除本地分支，不建 worktree |
| 远程查询失败 | 1 | 删除本地与远程占号分支 |
| 同号改号超过 10 次 | 1 | 删除本次占号 |
| worktree 创建失败 | 1 | 删除 worktree 残留、远程与本地占号分支 |
| 路径已存在 | 1 | 不修改远程 |

## 复用

在 feature worktree 内运行时，返回当前 worktree 的信息：`CREATED=false`、`IN_WORKTREE=true`、`CLAIMED=false`，不新建分支。
