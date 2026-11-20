/**
 * 前端字典与命名空间。
 * 导出 NS、MetaToolsKey、zh、en；中文字典是键集事实源。
 */

import type { ModelKey } from '@deepseek-ai/dsh-client-ui-model-selection/src/client/locales.ts';

/** 前端使用的字典命名空间，与插件名一致。 */
export const NS = 'dsh-plugin-meta-tools';

/** 中文字典。 */
export const zh = {
  'config.summary': '选择向 AI 开放哪些元工具',
  'config.group.sessionModel': '新增会话',
  'config.sessionModel.label': '模型',
  'config.sessionModel.description': '选择 AI 新建会话时使用的 provider、模型与推理等级。',
  'config.sessionPreset.label': '预设',
  'config.sessionPreset.description': '选择新建会话时使用的预设。',
  'config.sessionPreset.followHost': '跟随宿主默认',
  'config.sessionPreset.loading': '加载中…',
  'config.sessionPreset.unavailable': '不可用',
  'config.sessionPreset.noService': '此部署不提供预设',
  'config.sessionPreset.loadFailed': '预设加载失败',
  'config.sessionPreset.retry': '重试',
  'config.sessionPreset.menuLabel': '选择预设',
  'config.group.workspace': '工作区',
  'config.group.sessionRead': '查看会话',
  'config.group.sessionManage': '管理会话',
  'config.workspace_list.label': '查看工作区',
  'config.workspace_list.description': '列出已注册的工作区、路径与会话数。',
  'config.workspace_create.label': '注册工作区',
  'config.workspace_create.description': '把一个已有目录加入工作区列表。',
  'config.workspace_remove.label': '移除工作区',
  'config.workspace_remove.description': '从列表移除工作区；目录与会话日志保留。',
  'config.workspace_rename.label': '重命名工作区',
  'config.workspace_rename.description': '修改工作区在侧栏显示的标题。',
  'config.session_list.label': '查找会话',
  'config.session_list.description': '按工作区、目录或标题列出会话。',
  'config.session_get.label': '读取会话日志',
  'config.session_get.description': '把会话及其 subagent 的日志复制到临时目录供 AI 阅读。',
  'config.session_create.label': '新建会话',
  'config.session_create.description': '在指定工作区新建会话，可附带第一条消息。',
  'config.session_stop.label': '停止会话',
  'config.session_stop.description': '停止会话当前的工作，排队的消息保留。',
  'config.session_send.label': '向会话发消息',
  'config.session_send.description': '向另一个会话发送消息，在对方的下一步送达。',
  'config.session_pin.label': '置顶会话',
  'config.session_pin.description': '置顶或取消置顶会话。',
  'config.session_archive.label': '归档会话',
  'config.session_archive.description': '归档或恢复会话；运行中的会话需先停止。',
  'config.unavailable': '插件配置不可用。',
  'config.readOnly': '此部署以只读方式保存设置。',
  'config.saveFailed': '此部署未接受这些值，已保留以便修改。',
  'config.save': '保存',
  'config.saving': '保存中…',
} as const;

/** 英文字典，键集与中文一致。 */
export const en: Record<MetaToolsKey, string> = {
  'config.summary': 'Choose which meta tools AI can use',
  'config.group.sessionModel': 'New sessions',
  'config.sessionModel.label': 'Model',
  'config.sessionModel.description':
    'Choose the provider, model, and reasoning effort AI uses for new sessions.',
  'config.sessionPreset.label': 'Preset',
  'config.sessionPreset.description': 'Choose the preset AI uses for new sessions.',
  'config.sessionPreset.followHost': 'Follow Host default',
  'config.sessionPreset.loading': 'Loading…',
  'config.sessionPreset.unavailable': 'Unavailable',
  'config.sessionPreset.noService': 'This deployment provides no presets.',
  'config.sessionPreset.loadFailed': 'Could not load presets',
  'config.sessionPreset.retry': 'Retry',
  'config.sessionPreset.menuLabel': 'Choose a preset',
  'config.group.workspace': 'Workspaces',
  'config.group.sessionRead': 'View sessions',
  'config.group.sessionManage': 'Manage sessions',
  'config.workspace_list.label': 'View workspaces',
  'config.workspace_list.description':
    'List registered workspaces with their paths and session counts.',
  'config.workspace_create.label': 'Register workspaces',
  'config.workspace_create.description': 'Add an existing folder to the workspace list.',
  'config.workspace_remove.label': 'Remove workspaces',
  'config.workspace_remove.description':
    'Remove a workspace from the list; its folder and session logs stay.',
  'config.workspace_rename.label': 'Rename workspaces',
  'config.workspace_rename.description': 'Change the title a workspace shows in the sidebar.',
  'config.session_list.label': 'Find sessions',
  'config.session_list.description': 'List sessions by workspace, folder, or title.',
  'config.session_get.label': 'Read session logs',
  'config.session_get.description':
    'Copy the logs of a session and its subagents to a temporary folder for AI to read.',
  'config.session_create.label': 'Create sessions',
  'config.session_create.description':
    'Start a session in a workspace, optionally with a first message.',
  'config.session_stop.label': 'Stop sessions',
  'config.session_stop.description': 'Stop the current work of a session; queued messages stay.',
  'config.session_send.label': 'Message sessions',
  'config.session_send.description':
    'Send a message to another session, delivered at its next step.',
  'config.session_pin.label': 'Pin sessions',
  'config.session_pin.description': 'Pin or unpin a session.',
  'config.session_archive.label': 'Archive sessions',
  'config.session_archive.description':
    'Archive or restore a session; a running session must be stopped first.',
  'config.unavailable': 'Plugin settings are unavailable.',
  'config.readOnly': 'This deployment stores settings read-only.',
  'config.saveFailed':
    'The deployment did not accept these values; they were left for you to correct.',
  'config.save': 'Save',
  'config.saving': 'Saving…',
};

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 本插件前端文案，键集取自中文字典。 */
    'dsh-plugin-meta-tools': MetaToolsKey;
    /** 复用官方模型选择器的文案命名空间。 */
    model: ModelKey;
  }
}

/** 本插件前端可用的字典键。 */
export type MetaToolsKey = keyof typeof zh;
