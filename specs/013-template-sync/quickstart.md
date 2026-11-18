# Quickstart: 对齐模板的元数据国际化与产物新鲜度门禁

## 前置

- Node.js 24.9 及以上，pnpm 11。
- 在仓库根安装依赖：`pnpm install --frozen-lockfile`。

## 元数据资源

1. 运行 `pnpm test:code`，确认 `tests/metadata.test.ts` 通过。
2. 删除 `locale/zh.json` 的 `meta.title` 后重跑，确认测试失败并指出文件路径；恢复文件。
3. 把 `package.json` 的 `files` 中 `locale/*.json` 删掉后重跑，确认测试失败并指出清单声明；恢复文件。
4. 运行 `pnpm build`，再运行 `npm pack --dry-run --json`，确认输出含 `locale/en.json` 与 `locale/zh.json`。

## 产物新鲜度

1. 删除 `dist/`，运行 `pnpm test:dist`，确认失败并提示 `pnpm build`。
2. 删除 `dist/`，运行 `pnpm check`，确认通过且全程未生成 `dist`。
3. 运行 `pnpm build`，确认构建末尾的 `test:dist` 通过。
4. 改动 `src/client/index.ts` 后直接运行 `pnpm test:dist`，确认失败并指出该文件；运行 `pnpm build` 后通过。

## 实机核对

1. 用 `real-device-test` skill 启动真实宿主并加载本插件。
2. 在 Settings → General → Language 切换中文与 English，核对“插件”页中本插件标题与描述各按语言显示。
3. 停用本插件后核对标题与描述照常显示。
4. 记录结果到 `specs/013-template-sync/rdt-report.md`。

## 全量门禁

运行 `pnpm format && pnpm full-check`，四项检查全部通过：类型、lint、源码测试、构建与产物测试。`npm pack --dry-run --json` 的输出与 `contracts/package-manifest.md` 的进包表一致。