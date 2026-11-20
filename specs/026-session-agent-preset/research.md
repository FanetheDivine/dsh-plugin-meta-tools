# Research: 配置新增会话的预设

## R-001 预设名册来源

- **Decision**: 客户端经 `ctx.remote.agentPresets.list()` 读取名册；后端经 `ctx.get('agentPresets')` 的 `list()` 读取。两端都按 `broken === undefined` 判断可用。新增 `@deepseek-ai/dsh-agent-preset-registry@0.2.2-rc.5` devDependency 获取类型。
- **Rationale**: 预设注册表已由宿主装配，返回行包含 `id`、`name`、`description`、`isDefault` 与 `broken`。直接读名册不需要改动宿主设置。
- **Alternatives Considered**:
  - 复用官方 Settings 的 `AgentPresetSectionController`：未导出为可复用选择器，且写宿主默认，已排除。
  - 在插件里镜像返回结构：无法稳定表达 `isDefault` 与 `broken`，且随宿主漂移。

## R-002 浮窗交互

- **Decision**: 触发器加 `Menu` 组件（`@deepseek-ai/dsh-client-ui-primitives`），使用 `open`、`anchor`、`items`、`selectedId`、`onSelect`、`onClose` 与 `portal`，首项为“跟随宿主默认”。
- **Rationale**: 用户要求使用 DSH 自带 menu。`Menu` 已处理键盘移动、焦点返回、浮层定位与裁切规避。
- **Alternatives Considered**:
  - 自建 popover：重复官方交互与无障碍处理。
  - 直接嵌入官方卡片列表：不符合“右侧 select”的形态要求。

## R-003 配置字段

- **Decision**: 新增字符串配置 `session_preset`，去除首尾空白，空值表示跟随宿主默认；不与其他字段成对校验。
- **Rationale**: 与默认模型的字符串字段一致，空值可逆，保存后热更新。
- **Alternatives Considered**:
  - 布尔或对象字段：无法表达预设标识与未选择状态。

## R-004 创建时解析预设

- **Decision**: 显式 `agent_preset` 优先；否则读取配置值并在宿主可用名册中匹配，匹配则使用，否则按空值处理。名册读取失败同样按空值处理。显式传入的无效预设仍由宿主拒绝。
- **Rationale**: 用户决定。配置值在部署变化后不应阻断创建，但显式意图保持强校验。
- **Alternatives Considered**:
  - 配置值不可用时返回错误：会阻断创建，已被用户否决。
  - 只信配置不查询名册：无法实现“从宿主获取可用预设”。

## R-005 依赖升级

- **Decision**: 全部 `@deepseek-ai/dsh-*` devDependencies 从 `0.2.2-rc.3` 升级到 `0.2.2-rc.5`，新增 registry 依赖，并更新 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。cordis 子包保持 `~4.1.0` 与 `~1.1.0`。
- **Rationale**: 用户决定与已安装宿主 `0.2.2-rc.5` 对齐，避免 rc.3 类型与 rc.5 运行时错位。
- **Risks**:
  - rc.5 的客户端包集合与路径可能变化，需要在安装后核对导出。
  - `dsh-client-ui-primitives` 与 `dsh-client-store` 仍发布，但不在 CLI 依赖图中；测试的源码别名路径需要重新确认。
- **Alternatives Considered**:
  - 保持 rc.3：用户否决。

## R-006 测试与验证

- **Decision**: 更新 `tests/config.test.ts`、`config-form.test.ts`、`session-ops.test.ts`、`client.test.ts`；新增预设目录与选择器测试；运行 package-pack 与 dist 测试；在真实宿主打开配置页并让 AI 新建会话。
- **Rationale**: 宪章原则 II 要求测试同步与真实宿主验证。
- **Alternatives Considered**:
  - 只跑单元测试：无法覆盖宿主 remote 与 Menu 的真实行为。