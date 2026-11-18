# Contract: 包清单

`package.json` 的 `exports` 与 `files` 决定宿主能否读到元数据，以及发布包是否包含这些文件。

## 清单声明

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./client": { "types": "./dist/client/index.d.ts", "default": "./dist/client.js" },
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg"
  },
  "files": ["dist", "cordis.patch.yml", "locale/*.json", "icon.svg", "README.md"]
}
```

- `exports` MUST 暴露 `./locale/*.json`，否则宿主读不到元数据。
- `files` MUST 覆盖 `dist`、`cordis.patch.yml`、`locale/*.json`、`icon.svg` 与 `README.md`。
- 既有导出 MUST 保留。

## 打包回归

`tests/package-pack.test.ts` 用 `npm pack --dry-run --json` 核对：

| 进包 | 不进包 |
| --- | --- |
| `dist/index.mjs`、`dist/index.d.ts`、`dist/client.js` | `src/**` |
| `cordis.patch.yml` | `tests/**` |
| `locale/en.json`、`locale/zh.json` | `scripts/**` |
| `icon.svg`、`README.md` | — |

该测试属于 `dist` project，运行前 MUST 通过产物新鲜度检查。