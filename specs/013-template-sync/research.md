# Research: 对齐模板的元数据国际化与产物新鲜度门禁

## R1. 产物新鲜度的判定

**Decision**: 判定依据是文件修改时间。全部产物存在，且最旧产物的修改时间不低于（不早于）所有构建输入的修改时间时视为新鲜；输入严格晚于最旧产物时判过期。

**Rationale**:

- `tsdown` 每次构建重写产物，修改时间随构建更新；源码与配置文件的修改时间反映输入变化。
- 只看「是否存在」会放过源码已改但未重建的产物，这正是模板 commit `93a934f` 修掉的问题。
- 用严格大于比较，避免 Windows 文件系统秒级精度下产物与输入同秒被判过期。

**Alternatives considered**:

- 用内容哈希：需要为每个输入重算哈希并保存基线，产物与输入的对应关系仍需人工维护。
- 用 `tsdown --watch` 的中间产物或构建清单：`tsdown` 未输出可复用清单，且增加构建耦合。
- 在测试内触发构建：隐藏过期产物，CI 与本地结果不一致，模板已移除该做法。

## R2. 测试分组与门禁

**Decision**: vitest 拆 `code` 与 `dist` 两个 project。`code` 排除 `tests/client-bundle.test.ts` 与 `tests/package-pack.test.ts`；`dist` 只包含这两份测试。`check` 运行 `test:code`，`build` 在生成产物与类型声明后运行 `test:dist`，`full-check` 串联两者。

**Rationale**:

- `check` 不读取 `dist`，删除 `dist` 后仍可通过，类型检查与源码测试不受产物状态影响。
- 产物测试紧跟构建，读取的产物与发布内容一致。
- CI 的 `check` job 运行 `full-check`，合并前仍覆盖两组测试。

**Alternatives considered**:

- 保留单一 `test` 脚本并在每个产物测试前检查：无法在 `check` 阶段区分源码问题与产物过期。
- 用环境变量切换：脚本组合更难读，CI 与本地易分歧。

## R3. 产物清单与构建输入

**Decision**: 产物为 `dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts`。构建输入为 `src/` 下全部文件与 `tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`。

**Rationale**:

- 产物清单与本仓库两组 tsdown 构建加 `tsc -p tsconfig.build.json` 的实际输出一致，类型声明输出到 `dist/`。
- `package.json` 参与构建（`exports`、`files`、`dsh.client`），同时是打包测试的输入。

**Alternatives considered**:

- 把整个仓库根作为输入：`tests/`、`docs/` 的改动会让产物永久过期，误报过多。
- 只列 `src/`：漏掉构建配置变更，产物与配置不一致时误判新鲜。

## R4. 元数据测试归属

**Decision**: `tests/metadata.test.ts` 属于源码测试，只读 `locale/` 与 `package.json`，不读 `dist`。

**Rationale**: 元数据资源直接进包，不经过构建；把它放进 `dist` project 会让元数据校验依赖构建状态。

**Alternatives considered**:

- 并入 `tests/package-pack.test.ts`：该测试需要 `npm pack` 与产物，元数据结构问题会被构建状态掩盖。

## R5. 基线语言与目录枚举

**Decision**: `locale/` 只允许 `en.json` 与 `zh.json`；测试枚举目录并与基线列表比对。

**Rationale**: 新增语言必须先登记到基线列表，否则资源文件漏测。宿主内置语言 id 与文件名的对应关系由目录枚举保证。

**Alternatives considered**:

- 只校验已登记的基线文件，允许额外文件：新增语言易漏测，且资源与前端字典可能错位。

## R6. 宪章修订范围

**Decision**: 原则 IX 增加元数据资源条款；原则 IV 的进包清单补 `locale/*.json` 与 `icon.svg`；原则 VI 把合并门禁改为 `pnpm full-check`。版本 1.10.0 → 1.11.0。

**Rationale**:

- 原则 IV 的进包清单与 `tests/package-pack.test.ts` 的实际断言不一致，`icon.svg` 与 `locale/*.json` 已在包内。
- 原则 VI 的合并门禁只写 `pnpm check`，拆分后 `check` 不读取 `dist`，合并前无法覆盖发布内容回归。
- MINOR：实质扩展已有原则，不删除原则。

**Alternatives considered**:

- 只增原则、不改 IV 与 VI：宪章与测试、脚本互相矛盾。
- MAJOR 重写：变更范围不涉及删除或重定义原则。

## R7. 实机核对

**Decision**: 用 `real-device-test` skill 在真实宿主上核对中英文切换与停用状态下的插件行文案，记录结果。

**Rationale**: 元数据由宿主读取，资源文件与清单声明只保证结构；回退顺序与停用状态的行为需要宿主验证。

**Alternatives considered**:

- 只做单元测试：无法验证宿主回退与停用状态的读取。
