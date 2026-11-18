# Contract: 脚本与测试分组

`package.json` 的脚本与 `vitest.config.ts` 的 project 共同定义质量门禁。

## 脚本

| 脚本 | 命令 | 读取 `dist` |
| --- | --- | --- |
| `test:code` | `vitest run --project code` | 否 |
| `test:dist` | `vitest run --project dist` | 是 |
| `check` | `pnpm run typecheck && pnpm run lint && pnpm run test:code` | 否 |
| `build` | `tsdown && tsc -p tsconfig.build.json && pnpm run test:dist` | 先写后读 |
| `full-check` | `pnpm run check && pnpm run build` | 是 |

- 脚本 MUST NOT 提供 `test`。
- `check` MUST NOT 触发构建。
- `build` MUST 在产物与类型声明生成后运行 `test:dist`。

## 产物新鲜度接口

`tests/support/dist-freshness.ts` 导出 `assertFreshDist(root?: string): void`。

| 输入 | 行为 |
| --- | --- |
| 产物齐全且最旧产物不早于全部构建输入 | 正常返回 |
| 任一产物缺失 | 抛出错误，列出缺失文件与修复命令 |
| 输入晚于最旧产物 | 抛出错误，列出晚于产物的文件与修复命令 |

错误信息 MUST 包含 `pnpm build`。

## 测试分组

| project | include | exclude |
| --- | --- | --- |
| `code` | `tests/**/*.test.ts`、`tests/**/*.test.mjs` | 产物测试、`worktrees/**`、`node_modules/**` |
| `dist` | `tests/client-bundle.test.ts`、`tests/package-pack.test.ts` | 继承根配置 |

- 两个 project MUST 继承根配置的 `@deepseek-ai/dsh-client-ui-primitives` 源码别名。
