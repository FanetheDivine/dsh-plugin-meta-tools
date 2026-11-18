# Feature Specification: 对齐模板的元数据国际化与产物新鲜度门禁

**Feature Branch**: `013-template-sync`

**Created**: 2026-11-18

**Status**: Draft

**Input**: 用户描述：「D:\Git\self\dsh-plugin-template 当前插件基于这个模板构建。查看模板最新的两个 commit 照此优化插件。」

模板最新两个 commit 为：

- `2a654dd feat(013): 插件元数据国际化与规范`：`locale/*.json` 元数据资源、包清单声明、`tests/metadata.test.ts`、`docs/i18n.md` 与宪章原则 IX。
- `93a934f fix(012): 产物测试的构建新鲜度`：`tests/support/dist-freshness.ts`、`test:code` 与 `test:dist` 拆分、vitest 双 project 以及文档与 CI 同步。

本需求把这两个机制移植到 `dsh-plugin-meta-tools`，文案与内容按本插件改写。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 语言切换显示本插件自己的标题与描述 (Priority: P1)

插件使用者把宿主语言在中文与英文之间切换。插件页的插件行、详情页标题与描述随之切换，停用状态下照常显示，可见文案不出现键名或英文包名。

**Why this priority**: 直接决定插件在插件页的可读性，缺失资源时用户看到 `dsh-plugin-meta-tools` 包名。

**Independent Test**: 把 `locale/` 中一种语言的 `meta.title` 删掉，运行元数据测试，观察测试失败并指出缺失键；恢复后测试通过。

**Acceptance Scenarios**:

1. **Given** 仓库含 `locale/en.json` 与 `locale/zh.json`，**When** 运行 `pnpm test:code`，**Then** 两份资源的 `meta` 均含非空 `title` 与 `description`，键集一致，测试通过。
2. **Given** 宿主语言为中文，**When** 打开“插件”页，**Then** 本插件行显示「工作区与会话工具」与对应中文描述。
3. **Given** 宿主语言为英文，**When** 打开“插件”页，**Then** 本插件行显示英文标题与描述。
4. **Given** 本插件被停用，**When** 查看插件行，**Then** 标题与描述照常按当前语言显示。

### User Story 2 - 发布内容与元数据缺失在提交前暴露 (Priority: P2)

维护者修改代码、元数据或包清单后运行检查。元数据缺少键、含禁用字符或漏掉包声明时测试失败；发布包内容由 `npm pack --dry-run` 核对。

**Why this priority**: 打包声明遗漏只在发布后暴露；资源结构错误会被宿主静默回退。

**Independent Test**: 从 `package.json` 的 `files` 移除 `locale/*.json`，运行元数据测试与打包测试，两者失败并指出声明缺失；恢复后通过。

**Acceptance Scenarios**:

1. **Given** `package.json` 未在 `exports` 声明 `./locale/*.json`，**When** 运行元数据测试，**Then** 测试失败并指出该声明。
2. **Given** `meta.title` 含换行或 `meta.description` 为空白，**When** 运行元数据测试，**Then** 测试失败。
3. **Given** 资源文件含零宽空格 U+200B 或 BOM U+FEFF，**When** 运行元数据测试，**Then** 测试失败。
4. **Given** 产物完整且新鲜，**When** 运行 `npm pack --dry-run --json`，**Then** tarball 含 `locale/en.json`、`locale/zh.json`、`icon.svg` 与 `dist` 产物。

### User Story 3 - 产物测试只在新鲜产物上运行 (Priority: P2)

维护者运行 `pnpm check` 与 `pnpm build`。`check` 不读取 `dist`；`build` 生成产物后运行产物测试。产物过期或缺失时，产物测试直接失败并提示运行 `pnpm build`，不再在测试内部触发构建。

**Why this priority**: 测试内部构建掩盖过期产物，CI 与本地结果不一致；构建产物与源码不一致时发布内容失真。

**Independent Test**: 在无 `dist` 的仓库运行 `pnpm test:dist`，观察测试失败并输出含 `pnpm build` 的提示；运行 `pnpm build` 后再次运行 `pnpm test:dist`，测试通过。

**Acceptance Scenarios**:

1. **Given** `dist` 目录不存在，**When** 运行 `pnpm test:dist`，**Then** 测试失败并提示运行 `pnpm build`。
2. **Given** `dist` 已构建，**When** 修改 `src/client/index.ts` 后运行 `pnpm test:dist`，**Then** 测试失败并指出该文件晚于产物。
3. **Given** `dist` 已构建且源码未改动，**When** 运行 `pnpm test:dist`，**Then** 前端产物测试与打包测试通过。
4. **Given** 删除 `dist` 后运行 `pnpm check`，**When** 源码测试全部完成，**Then** `check` 通过，不读取 `dist`。
5. **Given** 运行 `pnpm build`，**When** 产物与类型声明生成完成，**Then** 构建流程末尾自动运行 `test:dist` 并通过。

### User Story 4 - 规范与命令集中在一处 (Priority: P3)

维护者要新增一种语言、调整测试命令或排查产物过期时，从文档索引进入 `docs/i18n.md` 与 `docs/development.md` 即可查全规则与命令。

**Why this priority**: 规范分散会导致元数据与字典各自演化，命令说明与实际脚本脱节。

**Independent Test**: 从 `AGENTS.md` 的文档索引进入 `docs/i18n.md`，按「新增一种语言」步骤执行，能列出需要改动的全部文件。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md` 文档索引，**When** 查找国际化规范，**Then** 索引含 `docs/i18n.md`。
2. **Given** `docs/development.md` 的命令表，**When** 查找测试命令，**Then** 表中列出 `test:code`、`test:dist`，且说明 `build` 末尾运行产物测试。
3. **Given** 宪章原则 IX，**When** 核对元数据条款，**Then** 条款覆盖资源位置、基线语言、键集一致、清单声明与禁用字符。

### Edge Cases

- `dist` 目录存在但只缺一个产物时，产物测试失败并列出缺失文件。
- 构建输入与产物修改时间相同视为新鲜；只有输入晚于最旧产物才判过期。
- `locale/` 出现基线语言之外的文件时，元数据测试失败，避免未登记的语言漏测。
- `meta.title` 为空串或全空白时，元数据测试失败。
- 资源文件无法解析为 JSON 或 `meta` 不是对象时，元数据测试失败并给出文件路径。
- `meta.detail` 指向包内不存在的 Markdown 时，元数据测试失败。
- Windows 文件系统时间精度导致源码与产物时间相同，判定为新鲜。

## Requirements *(mandatory)*

### Functional Requirements

元数据资源：

- **FR-001**: `locale/en.json` 与 `locale/zh.json` MUST 各含 `meta.title` 与 `meta.description`；标题单行，描述说明能力、用法与限制。
- **FR-002**: 两份资源的 `meta` 键集 MUST 一致。
- **FR-003**: 资源文件 MUST 不含零宽空格 U+200B 与 BOM U+FEFF。
- **FR-004**: 资源声明 `meta.detail` 时，其值 MUST 指向包内存在的 `docs/*.md` 文件。
- **FR-005**: `package.json` MUST 在 `exports` 声明 `./locale/*.json`，并在 `files` 包含 `locale/*.json`。
- **FR-006**: `tests/metadata.test.ts` MUST 覆盖资源结构、键集、禁用字符、`meta.detail` 与清单声明，失败信息 MUST 指出具体文件。
- **FR-007**: 元数据测试 MUST 属于源码测试，随 `pnpm test:code` 运行。

产物新鲜度：

- **FR-008**: `tests/support/dist-freshness.ts` MUST 导出 `assertFreshDist`，判定规则为全部产物存在且最旧产物晚于所有构建输入。
- **FR-009**: 构建输入 MUST 包含 `src/` 下全部文件、`tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`。
- **FR-010**: 产物清单 MUST 包含 `dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts`。
- **FR-011**: 产物缺失或过期时，`assertFreshDist` MUST 抛出错误，列出缺失与晚于产物的文件，并提示运行 `pnpm build`。
- **FR-012**: `tests/client-bundle.test.ts` 与 `tests/package-pack.test.ts` MUST 在读取 `dist` 前调用 `assertFreshDist`，且 MUST NOT 自行触发构建。
- **FR-013**: `tests/dist-freshness.test.ts` MUST 覆盖新鲜、输入晚于产物、产物全缺、缺任一产物四种状态。
- **FR-014**: `vitest.config.ts` MUST 定义 `code` 与 `dist` 两个 project；`code` 排除读取 `dist` 的测试，`dist` 只包含这些测试。
- **FR-015**: `package.json` 的脚本 MUST 提供 `test:code` 与 `test:dist`，移除 `test`；`check` MUST 运行 `test:code`。
- **FR-016**: `build` MUST 在生成产物与类型声明后运行 `test:dist`，使 `full-check` 覆盖两组测试。
- **FR-017**: CI 的检查 job 名称 MUST 反映「类型检查 + lint + 源码测试 + 构建 + 产物测试」的顺序。

文档：

- **FR-018**: 新增 `docs/i18n.md`，写明元数据资源位置与字段、包清单声明、前端字典、语言与回退顺序、新增语言步骤与校验命令。
- **FR-019**: 宪章原则 IX MUST 增加元数据资源条款；版本按 MINOR 递增，同步影响报告记录本次修订。
- **FR-020**: `AGENTS.md` MUST 在文档索引列出 `docs/i18n.md`，并新增项目说明小节，列出技术栈与常用脚本。
- **FR-021**: `README.md`、`docs/how-it-works.md`、`docs/development.md` 与 `docs/known-risks.md` MUST 指向 `docs/i18n.md`；`development.md` MUST 记录 `test:code`、`test:dist`、`build` 的新流程与测试文件表。
- **FR-022**: `CHANGELOG.md` MUST 记录元数据资源、国际化文档、宪章修订与测试脚本拆分。

### Key Entities

- **元数据资源**：`locale/<语言 id>.json`，`meta` 下 `title`、`description` 与可选 `detail`。
- **构建输入**：决定 `dist` 内容的源码与构建配置文件。
- **产物**：`dist` 下随包发布的前端、宿主与类型声明文件。
- **测试分组**：`code` 与 `dist` 两个 vitest project，对应两个 pnpm 脚本。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 从 `locale/` 删除任一 `meta.title` 后，元数据测试在 1 次运行内失败，失败信息含缺失文件的路径。
- **SC-002**: `pnpm check` 在删除 `dist/` 后的仓库中通过，全程不读取 `dist`。
- **SC-003**: `pnpm test:dist` 在删除 `dist/` 或改动源码后失败，失败信息含 `pnpm build`；`pnpm build` 之后同一命令通过。
- **SC-004**: 新增一种语言需要改动的文件不超出：`locale/<id>.json`、`src/client/locales.ts`、元数据与字典测试中的基线列表、`docs/i18n.md`。
- **SC-005**: `npm pack --dry-run --json` 的产物包含 `locale/en.json` 与 `locale/zh.json`。
- **SC-006**: 插件页在中文与英文下各显示一行标题与描述，均不含键名或英文包名。

## Assumptions

- 基线语言为 `en` 与 `zh`，与宿主内置语言一致。
- 宿主负责读取元数据、匹配语言与执行回退；本仓库保证资源与声明正确。
- 插件页标题与描述沿用现有文案，本次只补规范与测试，不改写文案内容。
- 前端字典已覆盖界面文案，本次不改变字典内容。
- 实机核对按 `real-device-test` skill 执行一次，覆盖中英文切换与停用状态。
