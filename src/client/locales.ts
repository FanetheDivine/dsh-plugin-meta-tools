/**
 * 前端字典与命名空间。
 * 导出 NS、MetaToolsKey、zh、en；中文字典是键集事实源。
 */

/** 前端使用的字典命名空间，与插件名一致。 */
export const NS = 'dsh-plugin-meta-tools';

/** 中文字典。 */
export const zh = {
  'config.summary': '选择向模型开放哪些工具',
  'config.workspace_list.label': '获取工作区信息',
  'config.workspace_create.label': '注册工作区',
  'config.workspace_remove.label': '删除工作区',
  'config.workspace_rename.label': '重命名工作区',
  'config.session_list.label': '获取会话信息',
  'config.session_get.label': '获取会话日志',
  'config.session_create.label': '新建会话',
  'config.session_stop.label': '停止会话',
  'config.session_send.label': '发送消息',
  'config.session_pin.label': '置顶会话',
  'config.session_archive.label': '归档会话',
  'config.unavailable': '插件配置不可用。',
  'config.readOnly': '此部署以只读方式保存设置。',
  'config.saveFailed': '此部署未接受这些值，已保留以便修改。',
  'config.save': '保存',
  'config.saving': '保存中…',
} as const;

/** 英文字典，键集与中文一致。 */
export const en: Record<MetaToolsKey, string> = {
  'config.summary': 'Choose which tools the model can call',
  'config.workspace_list.label': 'Get workspace info',
  'config.workspace_create.label': 'Register a workspace',
  'config.workspace_remove.label': 'Delete a workspace',
  'config.workspace_rename.label': 'Rename a workspace',
  'config.session_list.label': 'Get session info',
  'config.session_get.label': 'Get session log',
  'config.session_create.label': 'Create a session',
  'config.session_stop.label': 'Stop a session',
  'config.session_send.label': 'Send a message',
  'config.session_pin.label': 'Pin a session',
  'config.session_archive.label': 'Archive a session',
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
  }
}

/** 本插件前端可用的字典键。 */
export type MetaToolsKey = keyof typeof zh;
