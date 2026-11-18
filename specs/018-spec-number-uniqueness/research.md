# Research: 协作场景的 spec 编号唯一性

## 决策 1：用远程占号分支作为编号所有权

- **Decision**: 创建 worktree 前先推送 `<type>/<NNN>-<name>` 分支到 `origin`，推送成功才算占号。
- **Rationale**: 远程分支是开发者都已读取的共享状态；不需要额外的编号服务或锁文件。
- **Alternatives considered**:
  - 仓库内锁文件：写入需要推送，冲突时仍要人工处理。
  - 仅本地记录：其他克隆看不到。

## 决策 2：同号冲突按完整分支名排序收敛

- **Decision**: 推送占号分支后重新查询远程分支，同号分支按 `LC_ALL=C sort` 排序，第一个保留编号，其余删除占号后改号重试，最多 10 次。
- **Rationale**: 双方使用同一排序规则，必然得出同一个保留者，不需要协商。
- **Alternatives considered**:
  - 按推送时间：远程不记录可靠的推送顺序。
  - 按开发者：需要额外约定身份。

## 决策 3：算号前同步远程全部分支

- **Decision**: `git fetch --prune origin` 拉取全部 head，再计算最大编号；`--no-fetch` 跳过同步。
- **Rationale**: 过期的 `refs/remotes/*` 会漏掉别人已推送的占号分支，重复由此产生。
- **Alternatives considered**:
  - 只 fetch base ref：看不到其他功能分支的编号。

## 决策 4：交付前校验远程分支与 base 的 spec 目录

- **Decision**: `check-spec-number.sh` 同时检查远程同号分支与 base ref 的 `specs/<NNN>-*` 目录，冲突退出码 4。
- **Rationale**: 创建后仍可能出现手工改号、分支合并或删除占号；PR 前再拦截一次。
- **Alternatives considered**:
  - 只在 CI 检查：发现晚，修复成本高。

## 决策 5：编号解析放在共享库，避免两个脚本各写一份

- **Decision**: 新增 `spec-number-lib.sh`，只定义 `feature_number_from_branch`、`remote_branches`、`spec_branches_with_number`。
- **Rationale**: 创建与交付前校验对“编号”和“同号”的定义必须一致。
- **Alternatives considered**:
  - 内联正则：两处容易漂移。

## 决策 6：占号失败中止创建

- **Decision**: `git push` 或 `git ls-remote` 失败时删除本地占号分支并退出 1，不创建 worktree。
- **Rationale**: 没有远程占号就没有唯一性保证；失败后继续会留下无法追踪的本地 spec。
- **Alternatives considered**:
  - 离线时仅本地创建并警告：重复风险回到原状。

## 决策 7：对齐上游模板实现

- **Decision**: 采用 `dsh-plugin-template` 提交 `59c91e7` 的脚本行为与接口，按本仓库文档与测试结构落地。
- **Rationale**: 行为已在模板仓库验证，两个仓库的 worktree 扩展保持同源。
- **Alternatives considered**:
  - 自行设计编号协议：增加维护成本，且与模板分叉。
