# Feature Specification: 工具描述标明 DSH 归属

**Feature Branch**: `feat/024-dsh-tool-keywords`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "为tool的描述增加DSH相关词语 不然AI无法识别"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI 认出工具属于当前 DSH (Priority: P1)

用户用 DSH 或 DeepSeek Harness 指代当前环境，要求查看工作区或会话。AI 读到工具描述后，把请求对应到本插件的工具，并知道这些工具作用于当前 DSH 实例。

**Why this priority**: 工具描述只写通用的 workspace 与 session，缺少 DSH 归属。AI 无法把用户所说的 DSH 与这些工具联系起来，容易忽略工具或选错工具。

**Independent Test**: 在真实 DSH 会话中，用包含 "DSH" 与 "DeepSeek Harness" 的请求触发工作区与会话工具，检查 AI 选中的工具符合用户意图。

**Acceptance Scenarios**:

1. **Given** 用户用 "DSH" 指代当前环境，**When** AI 浏览可用工具，**Then** 十一个工具的描述都出现 "DSH"。
2. **Given** 用户用 "DeepSeek Harness" 全称提出请求，**When** AI 选择工具，**Then** 任取一个工具的描述都能把全称与缩写对应起来。
3. **Given** 用户要求查看工作区或会话，**When** AI 选中 workspace_list 或 session_list，**Then** 描述写明这些对象属于当前 DSH 实例。

---

### User Story 2 - 描述改动不影响调用契约 (Priority: P2)

现有工具调用的参数、返回与错误保持原样。新增工具时，测试能发现缺少 DSH 归属的描述。

**Why this priority**: 描述是模型调用契约的一部分。改动只服务于识别，不能破坏已有会话形成的调用习惯。

**Independent Test**: 运行契约测试，逐项比较十一个工具的描述、参数与输出；再用现有调用流程做回归。

**Acceptance Scenarios**:

1. **Given** 十一个工具的描述已更新，**When** 执行契约测试，**Then** 名称、参数、返回与错误保持原有断言。
2. **Given** 新增一个工具，**When** 它的描述缺少 DSH 相关词，**Then** 测试失败并指出该工具。

### Edge Cases

- "DSH" 统一大写，"DeepSeek Harness" 保持官方大小写。
- 描述保持英文，与现有工具描述语言一致。
- 描述只增加归属语句，不引入新的能力承诺。
- 工具名、参数名、参数描述、配置键与开关保持不变。
- 关闭某个工具的开关后，该工具照常不注册。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 十一个工具的顶层描述 MUST 各包含 "DSH"。
- **FR-002**: 十一个工具的顶层描述 MUST 各包含 "DeepSeek Harness" 全称，使单个描述可以独立识别。
- **FR-003**: 描述 MUST 用 "DSH" 限定所属对象：工作区工具写 "DSH workspace"，会话工具写 "DSH session"。
- **FR-004**: 描述 MUST 保持英文。
- **FR-005**: 工具名、参数名、参数描述、输出与错误 MUST 保持不变。
- **FR-006**: 契约测试 MUST 校验每个工具描述同时包含 "DSH" 与 "DeepSeek Harness"；新增工具缺少任一词时测试失败。
- **FR-007**: 工具开关、配置键与插件元数据 MUST 保持不变。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 十一个工具的描述全部包含 "DSH"，覆盖率为 100%。
- **SC-002**: 十一个工具的描述全部包含 "DeepSeek Harness"，覆盖率为 100%。
- **SC-003**: 契约测试全部通过，工具名称、参数、输出与错误断言零变化。
- **SC-004**: 在真实 DSH 会话中，用包含 "DSH" 与 "DeepSeek Harness" 的请求查看工作区与会话，AI 选中对应工具的成功率为 100%。

## Assumptions

- 改动范围是十一个工具的顶层描述，参数描述保持现状。
- 工具描述面向模型，沿用英文。
- 不新增工具、不调整配置页、不改动插件元数据。
- 现有契约测试保存各工具描述的完整文本，更新描述时同步更新该文件。
- DSH 相关词指 "DSH" 与 "DeepSeek Harness" 两种写法。
