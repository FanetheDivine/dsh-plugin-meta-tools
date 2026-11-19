# Feature Specification: 配置新增会话的模型

**Feature Branch**: `feat/022-configure-session-model`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "要允许配置 新增session的provider/model/effort"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 按任务选择新会话模型 (Priority: P1)

用户让 AI 新增会话时，可以指定 provider、model 和 effort，让新会话从首轮工作开始使用所需模型配置。

**Why this priority**: 不同任务需要不同模型能力与推理强度。新增会话目前无法选择这些配置，限制了任务分派。

**Independent Test**: 使用一组有效的 provider、model 和 effort 新增会话并附带首条消息，检查新会话从首轮开始使用指定配置。

**Acceptance Scenarios**:

1. **Given** 存在有效的 provider、model 和 effort 组合，**When** 用户新增会话并同时提供三项配置，**Then** 新会话使用这三项配置。
2. **Given** 新增会话包含首条消息，**When** 用户指定模型配置，**Then** 首条消息产生的首轮工作使用该配置。
3. **Given** 用户提供 provider 和 model 并省略 effort，**When** 新增会话，**Then** 新会话使用指定路由与所选模型的默认 effort。
4. **Given** 用户未提供模型配置，**When** 按现有方式新增会话，**Then** 新会话沿用默认选择，其他行为保持不变。

### Edge Cases

- provider、model 或 effort 只包含空白字符时，按未提供处理。
- 只提供 provider 或 model 时，请求在创建会话前返回参数错误。
- 未同时提供 provider 和 model 而提供 effort 时，请求在创建会话前返回参数错误。
- provider 或 model 不可用时，请求返回可理解的错误。
- effort 不适用于所选 provider 或 model 时，请求返回可理解的错误。
- 模型配置在会话创建后失败时，错误包含新会话 id，且不设置标题或投递首条消息。
- 模型配置与工作区、目录、预设、标题或首条消息同时提供时，各项能力保持原有行为。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 用户 MUST 能在新增会话时同时指定 provider 与 model，并可选择 effort。
- **FR-002**: 系统 MUST 将用户提供的模型配置应用于新会话的首轮及后续工作。
- **FR-003**: 系统 MUST 在未提供模型配置时沿用默认选择，在省略 effort 时使用所选模型的默认值。
- **FR-004**: 系统 MUST 在设置标题与投递首条消息前完成模型配置。
- **FR-005**: 系统 MUST 拒绝不完整或无效的模型配置，并返回可理解的错误。
- **FR-006**: 新增模型配置 MUST 保持现有新增会话调用的兼容性；现有参数、返回结果与默认行为保持兼容。
- **FR-007**: 模型配置失败时，系统 MUST 停止后续标题设置与首条消息投递；会话已创建时，错误 MUST 包含新会话 id。
- **FR-008**: 模型配置 MUST 只作用于新会话，不修改全局默认模型。

### Key Entities *(include if feature involves data)*

- **模型配置**: 新增会话的模型选择，包含成对的 provider、model 与可选的 effort。
- **新会话**: 使用模型配置执行的会话，可同时具有工作区、目录、预设、标题与首条消息。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% 使用有效 provider、model 和 effort 的新增会话请求，从首轮开始应用所请求的配置。
- **SC-002**: 100% 省略模型配置的现有新增会话请求保持原有默认行为。
- **SC-003**: 100% 无效模型配置请求返回明确失败结果，且不投递首条消息。
- **SC-004**: 用户只需一次新增会话请求即可完成模型选择，无需创建后再次配置。
- **SC-005**: 100% 指定模型配置的新增会话请求保持全局默认模型不变。

## Assumptions

- 宿主提供会话级模型选择能力，并可校验 provider、model 与 effort 的有效性。
- provider 与 model 使用宿主支持的标识，并组成完整路由。
- effort 的可用值由所选 provider 与 model 决定。
- 未指定模型配置时，默认模型选择继续由宿主与所选预设决定。
- 本需求只扩展新增会话能力，不提供修改已有会话模型配置的能力。
