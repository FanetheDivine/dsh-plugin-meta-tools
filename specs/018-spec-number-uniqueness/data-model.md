# Data Model: 协作场景的 spec 编号唯一性

## 实体

### Spec 编号

标识一个 spec 的三位数字。

| 字段 | 说明 |
| --- | --- |
| `value` | 三位数字，`001` 起，补零 |
| `owner` | 使用该编号的分支名 |
| `state` | `free`、`claimed`、`merged` 或 `retired` |

规则：

- `claimed` 由远程分支存在确定。
- `merged` 由 base ref 的 `specs/<NNN>-*` 目录确定。
- `retired` 的编号继续占用，不复用。

### 占号分支

| 字段 | 说明 |
| --- | --- |
| `name` | `<type>/<NNN>-<slug>` |
| `remote` | `origin` |
| `ref` | 分支 tip 的 commit |

规则：

- 分支在远程存在即表示编号已占用。
- 创建失败时删除远程与本地分支，编号回到 `free`。
- 短名相同且编号相同时，双方视为同一个分支。

### Spec 目录

| 字段 | 说明 |
| --- | --- |
| `path` | `specs/<NNN>-<slug>` |
| `number` | 目录名的三位数字前缀 |
| `slug` | 目录名去掉编号前缀后的部分 |

规则：

- 目录名、worktree 目录名与分支名使用同一个编号与短名。
- 目录随分支合并进入 `main`，之后编号进入 `merged`。

### 编号分配输入

| 来源 | 读取方式 |
| --- | --- |
| 远程分支 | `git ls-remote --heads origin` 或同步后的 `refs/remotes/*` |
| base ref 的 spec 目录 | `git ls-tree <base-ref> -- specs/` |
| 本地分支 | `refs/heads/*` |
| 主工作区 spec 目录 | 主工作区 `specs/` |

规则：

- 下一个编号取全部来源中的最大编号加一。
- 同一编号出现在多个来源时只计一次。

### 唯一性校验结果

| 字段 | 说明 |
| --- | --- |
| `BRANCH` | 被校验的分支名 |
| `FEATURE_NUM` | 从分支名解析出的编号，无编号时为空 |
| `UNIQUE` | 是否唯一 |
| `SKIPPED` | 分支名没有编号时为 `true` |
| `CONFLICTS` | 同号分支或 spec 目录列表 |

## 状态转换

```text
candidate --push成功--> claimed --worktree创建成功--> spec进行中
    |                       |
    |                       +--同号冲突--> 删除占号 --改号--> candidate
    |
    +--push失败--> free（本地分支与 worktree 均不存在）

spec进行中 --合并进main--> merged
spec进行中 --放弃--> retired（编号不复用）
```

## 校验规则

- 编号必须为三位数字。
- 分支名、worktree 目录名与 spec 目录名中的编号必须一致。
- 同号分支的保留者按完整分支名做 `LC_ALL=C` 升序排序确定。
- 改号只改变编号，保留短名与类型。
- 占号失败、worktree 创建失败或校验失败时不得留下部分状态。
