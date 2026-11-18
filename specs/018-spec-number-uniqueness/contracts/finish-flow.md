# Contract: finish 流程的编号校验

`/speckit-worktree-finish` 在推送分支与创建 PR 之前校验编号唯一性。

## 位置

| 顺序 | 步骤 |
| --- | --- |
| 1 | 质量门禁 |
| 2 | 补充 CHANGELOG |
| 3 | 同步 base 并处理合并 |
| 4 | 提交剩余变更 |
| 5 | **校验 spec 编号** |
| 6 | 推送分支并创建 PR |
| 7 | 等待 CI |
| 8 | 等待反馈、冲突与合并 |
| 9 | 清理 |

## 校验

```bash
.specify/extensions/worktree/scripts/bash/check-spec-number.sh --json
```

| 退出码 | 处理 |
| --- | --- |
| 0 | 继续推送与创建 PR |
| 4 | 停止交付，报告 `CONFLICTS` 中的分支与目录，不推送、不创建 PR |
| 1 | 报告错误并停止 |

## 冲突处理

- 冲突来自其他远程分支：与对方协调，保留一个编号，另一个改号并同步分支名、worktree 目录与 spec 目录。
- 冲突来自 base ref 的 spec 目录：当前分支改号。
- 改号后重新运行质量门禁与校验，再推送。

## abandon 模式

放弃流程不校验编号；分支已推送时保留远程分支，并在结果中说明。
