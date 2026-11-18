# Data Model: 对齐模板的元数据国际化与产物新鲜度门禁

## 元数据资源

`locale/<语言 id>.json` 的一份资源，随 npm 包分发，由宿主在插件未激活时读取。

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `meta` | object | 是 | 唯一顶层键 |
| `meta.title` | string | 是 | 非空白；单行，不含 `\r` 与 `\n` |
| `meta.description` | string | 是 | 非空白；说明能力、用法与限制 |
| `meta.detail` | string | 否 | 形如 `docs/<name>.md`，文件必须在包内存在 |

校验规则：

- 文件名即语言 id，目录内只允许基线语言文件。
- 各语言的 `meta` 键集一致。
- 原文不含 U+200B 与 U+FEFF。
- 文件为 UTF-8 编码的合法 JSON。

状态：资源随文件改动生效，无运行时状态。

## 构建输入

决定 `dist/` 内容的文件集合。

| 成员 | 来源 |
| --- | --- |
| `src/**` | 源码目录递归枚举 |
| `tsdown.config.ts` | 构建配置 |
| `tsconfig.json` | 类型检查配置 |
| `tsconfig.build.json` | 类型声明输出配置 |
| `package.json` | 导出、打包清单与脚本 |

## 产物

`dist/` 下随包发布的文件，全部存在才进入新鲜度比较。

| 产物 | 生成者 |
| --- | --- |
| `dist/client.js` | tsdown 浏览器组 |
| `dist/index.mjs` | tsdown 宿主组 |
| `dist/index.d.ts` | `tsc -p tsconfig.build.json` |
| `dist/client/index.d.ts` | `tsc -p tsconfig.build.json` |

新鲜度状态：

| 状态 | 条件 | 结果 |
| --- | --- | --- |
| 新鲜 | 产物齐全，且最旧产物时间 ≥ 全部输入时间 | 继续执行产物测试 |
| 过期 | 产物齐全，存在输入时间 > 最旧产物时间 | 抛出错误，列出晚于产物的输入 |
| 缺失 | 任一产物不存在 | 抛出错误，列出缺失产物与过期输入 |

## 测试分组

| project | 包含 | 读取 `dist` | 执行者 |
| --- | --- | --- | --- |
| `code` | `tests/**/*.test.ts`、`tests/**/*.test.mjs`，排除产物测试 | 否 | `pnpm test:code`、`pnpm check` |
| `dist` | `tests/client-bundle.test.ts`、`tests/package-pack.test.ts` | 是 | `pnpm test:dist`、`pnpm build` 末尾、`pnpm full-check` |

## 关系

- 产物测试（`dist` project）在读取产物前调用 `assertFreshDist`，后者读取构建输入与产物清单。
- 元数据测试（`code` project）读取 `locale/*.json` 与 `package.json` 的清单声明。
- 打包测试（`dist` project）读取同一份 `package.json` 的 `files`，核对 tarball 内容。
