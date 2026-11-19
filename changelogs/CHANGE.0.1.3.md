# Changelog

## [0.1.3] - 2026-11-19

## Unreleased

### Fixed

- 修复 `session_create` 首条消息与 `session_send` 的 queue/steer 投递，向宿主传递当前调用的取消信号

### Added

- `/speckit-worktree-create` 创建 spec 时同步远程全部分支并推送占号分支，同号时按分支名自动改号
- `/speckit-worktree-finish` 在推送与 PR 前校验编号唯一
- `.specify/extensions/worktree/scripts/bash/spec-number-lib.sh`：spec 编号解析与同号分支匹配
- `.specify/extensions/worktree/scripts/bash/check-spec-number.sh`：交付前的编号唯一性校验
- `tests/worktree-extension.test.ts`：占号、自动改号、远程分支同步与交付前校验用例
