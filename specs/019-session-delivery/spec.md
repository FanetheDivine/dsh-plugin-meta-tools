# Feature Specification: 会话消息投递修复

**Feature Branch**: `fix/019-session-delivery`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "发布到 npm 后，session_create 带 prompt 时会创建会话但首条消息投递失败；session_send 的 queue 和 steer 模式均报 Cannot read properties of undefined (reading 'throwIfAborted')；需要恢复消息投递并验证运行中会话的停止能力。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 向已有会话投递消息 (Priority: P1)

用户向已有会话发送消息，并选择排队或立即引导的处理方式。会话应收到消息并按所选方式处理。

**Why this priority**: 消息投递是持续操作会话的基础能力，当前两种模式均不可用。

**Independent Test**: 分别创建一个可接收消息的会话，以 queue 和 steer 两种方式各发送一条消息，确认消息进入目标会话且用户可看到处理结果。

**Acceptance Scenarios**:

1. **Given** 一个已存在且可接收消息的会话，**When** 用户以 queue 模式发送消息，**Then** 消息成功进入该会话的待处理流程，且不出现空对象属性访问错误。
2. **Given** 一个已存在且可接收消息的会话，**When** 用户以 steer 模式发送消息，**Then** 消息成功引导该会话的当前或后续处理，且不出现空对象属性访问错误。
3. **Given** 一个正在处理任务的会话，**When** 用户请求停止，**Then** 当前处理被取消，会话随后可继续接收消息。

---

### User Story 2 - 创建会话并投递首条消息 (Priority: P1)

用户在创建会话时提供首条消息，期望新会话立即开始处理该消息。

**Why this priority**: 该入口与向已有会话发送消息同样核心，当前会留下已创建但未处理首条消息的会话。

**Independent Test**: 使用一条明确的首条消息创建新会话，确认只创建一个目标会话，首条消息可见并触发处理。

**Acceptance Scenarios**:

1. **Given** 用户提供了有效的会话配置和首条消息，**When** 用户创建会话，**Then** 新会话包含该首条消息并开始处理。
2. **Given** 用户未提供首条消息，**When** 用户创建会话，**Then** 新会话正常创建并保持空闲，可接收后续消息。

### Edge Cases

- 目标会话正在处理任务时，queue 与 steer 均按各自语义工作。
- 目标会话空闲时，两种发送模式均能触发处理。
- 目标会话不存在或已不可用时，返回明确的失败信息，不产生虚假的成功结果。
- 首条消息投递失败时，用户能识别失败，并可向已创建的会话重新发送消息。
- 停止空闲会话不产生破坏性问题；停止运行中会话能够验证真实取消效果。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 用户 MUST 能以 queue 模式向有效的已有会话投递消息。
- **FR-002**: 用户 MUST 能以 steer 模式向有效的已有会话投递消息。
- **FR-003**: 用户 MUST 能在创建会话时同时投递首条消息。
- **FR-004**: 不带首条消息的会话创建行为 MUST 保持可用。
- **FR-005**: 消息投递失败 MUST 返回可诊断的错误信息，且不得报告投递成功。
- **FR-006**: 恢复消息投递后，用户 MUST 能停止运行中的会话处理，并继续后续交互。
- **FR-007**: 无效或不可用目标会话 MUST 得到明确失败结果，不得影响其他会话。
- **FR-008**: 修复 MUST 覆盖用户实际安装和使用的发布产物，而不仅是开发环境。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: queue、steer 和创建时携带首条消息三条核心流程的验收用例全部通过，成功率为 100%。
- **SC-002**: 三条核心流程中，空对象属性访问错误出现次数为 0。
- **SC-003**: 不带首条消息的会话创建及运行中会话停止的回归用例全部通过。
- **SC-004**: 用户从发布产物执行上述核心流程时，结果与开发环境验收一致。

## Assumptions

- 本次范围包括会话创建、queue/steer 消息投递及恢复投递后的停止能力验证。
- 不改变 queue 与 steer 的既有用户语义。
- 不引入新的会话管理功能或修改无关工具。
- 无效目标的既有错误形式可保留，只需确保错误明确且可诊断。
