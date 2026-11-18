/**
 * 前端字典与命名空间。
 * 导出 NS、MetaToolsKey、zh、en；中文字典是键集事实源。
 */

/** 前端使用的字典命名空间，与插件名一致。 */
export const NS = 'dsh-plugin-meta-tools';

/** 中文字典。 */
export const zh = {
  'config.summary': '选择向模型开放哪些工作区与会话工具',
  'config.workspace_list.title': '列出工作区',
  'config.workspace_list.description': '按 id 列出本 profile 的工作区、路径与会话数。',
  'config.workspace_create.title': '添加工作区',
  'config.workspace_create.description': '注册一个已存在的绝对目录，不复制或移动磁盘内容。',
  'config.workspace_remove.title': '移除工作区',
  'config.workspace_remove.description': '只移除注册；目录与全部会话日志保留。',
  'config.workspace_rename.title': '重命名工作区',
  'config.workspace_rename.description': '修改工作区显示标题，目录路径不变。',
  'config.session_list.title': '列出会话',
  'config.session_list.description': '按最新优先列出会话，可按工作区或目录筛选。',
  'config.session_get.title': '读取会话',
  'config.session_get.description': '按 id 读取会话元数据与最新可见消息。',
  'config.unavailable': '插件配置不可用。',
  'config.readOnly': '此部署以只读方式保存设置。',
  'config.saveFailed': '此部署未接受这些值，已保留以便修改。',
  'config.save': '保存',
  'config.saving': '保存中…',
} as const;

/** 英文字典，键集与中文一致。 */
export const en: Record<MetaToolsKey, string> = {
  'config.summary': 'Choose which workspace and session tools the model can call',
  'config.workspace_list.title': 'List workspaces',
  'config.workspace_list.description':
    'List this profile’s workspaces with ids, paths and session counts.',
  'config.workspace_create.title': 'Add a workspace',
  'config.workspace_create.description':
    'Register an existing absolute directory without copying or moving anything on disk.',
  'config.workspace_remove.title': 'Remove a workspace',
  'config.workspace_remove.description':
    'Remove the registration only; the directory and every session log stay.',
  'config.workspace_rename.title': 'Rename a workspace',
  'config.workspace_rename.description':
    'Change the display title; the directory path is unchanged.',
  'config.session_list.title': 'List sessions',
  'config.session_list.description':
    'List sessions newest first, filtered by workspace or working directory.',
  'config.session_get.title': 'Read a session',
  'config.session_get.description':
    'Read one session’s metadata and latest visible messages by id.',
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
