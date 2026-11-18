// 会话操作测试：新建、停止、发送提醒、置顶与归档。
import { describe, expect, it, vi } from 'vitest';
import {
  buildSessionArchiveTool,
  buildSessionCreateTool,
  buildSessionPinTool,
  buildSessionSendTool,
  buildSessionStopTool,
  systemReminder,
} from '../src/session-ops.ts';
import type {
  SessionControllerLike,
  SessionCreateRequestLike,
  SessionPromptRequestLike,
  WorkspaceRegistryLike,
} from '../src/types.ts';

/** 假会话控制服务。 */
function makeController() {
  const create = vi.fn(async (request: SessionCreateRequestLike) => ({
    sessionId: 'session-new',
    ...(request.agentPreset === undefined ? {} : { agentPreset: request.agentPreset }),
  }));
  const rename = vi.fn(async (request: { sessionId: string; title: string }) => ({
    title: request.title,
    seq: 1,
  }));
  const prompt = vi.fn(async (_request: SessionPromptRequestLike) => ({ accepted: true as const }));
  const cancel = vi.fn((_request: { sessionId: string }) => ({ accepted: true as const }));
  const controller: SessionControllerLike = { create, rename, prompt, cancel };
  return { controller, create, rename, prompt, cancel };
}

/** 假工作区注册表。 */
function makeRegistry() {
  const pinSession = vi.fn(async () => undefined);
  const unpinSession = vi.fn(async () => undefined);
  const archiveSession = vi.fn(async () => undefined);
  const unarchiveSession = vi.fn(async () => undefined);
  const registry = {
    list: () => [],
    get: () => undefined,
    resolveByPath: async () => undefined,
    create: async () => {
      throw new Error('unused');
    },
    delete: async () => false,
    pinSession,
    unpinSession,
    archiveSession,
    unarchiveSession,
    archivedSessionIds: [],
    pinnedSessionIds: [],
  } as unknown as WorkspaceRegistryLike;
  return { registry, pinSession, unpinSession, archiveSession, unarchiveSession };
}

/** 执行上下文桩。 */
function execWith(cwd?: string) {
  return {
    signal: new AbortController().signal,
    ...(cwd === undefined ? {} : { agent: { session: { id: 'caller', header: { cwd } } } }),
  } as never;
}

/** 默认执行上下文。 */
const exec = execWith();

describe('session_create', () => {
  it('按位置、预设、标题与首条消息创建会话', async () => {
    const { controller, create, rename, prompt } = makeController();
    const tool = buildSessionCreateTool({ sessionController: controller });
    const value = (await tool.execute(
      {
        cwd: 'D:\\new',
        agent_preset: 'standard',
        title: '新会话',
        prompt: 'hello',
      },
      exec,
    )) as { sessionId: string; agentPreset: string; title: string; prompted: boolean };
    expect(create).toHaveBeenCalledWith({ cwd: 'D:\\new', agentPreset: 'standard' });
    expect(rename).toHaveBeenCalledWith({ sessionId: 'session-new', title: '新会话' });
    const promptRequest = prompt.mock.calls[0]?.[0];
    expect(promptRequest).toMatchObject({
      sessionId: 'session-new',
      mode: 'queue',
      content: [{ type: 'text', text: 'hello' }],
    });
    expect(value).toMatchObject({
      sessionId: 'session-new',
      agentPreset: 'standard',
      title: '新会话',
      prompted: true,
    });
  });

  it('未给位置时沿用调用方目录', async () => {
    const { controller, create } = makeController();
    const tool = buildSessionCreateTool({ sessionController: controller });
    await tool.execute({}, execWith('D:\\caller-dir'));
    expect(create).toHaveBeenCalledWith({ cwd: 'D:\\caller-dir' });
  });

  it('workspace_id 与 cwd 互斥', async () => {
    const { controller } = makeController();
    const tool = buildSessionCreateTool({ sessionController: controller });
    await expect(tool.execute({ workspace_id: 'w1', cwd: 'D:\\x' }, exec)).rejects.toThrow(
      'workspace_id and cwd are mutually exclusive',
    );
  });

  it('首条消息失败时带出新会话 id', async () => {
    const { controller, prompt } = makeController();
    prompt.mockRejectedValueOnce(new Error('session archived'));
    const tool = buildSessionCreateTool({ sessionController: controller });
    await expect(tool.execute({ prompt: 'hello' }, exec)).rejects.toThrow(
      "The session 'session-new' was created, but its first prompt failed: session archived",
    );
  });

  it('渲染新建结果', async () => {
    const { controller } = makeController();
    const tool = buildSessionCreateTool({ sessionController: controller });
    const value = await tool.execute({ title: '标题' }, exec);
    const [block] = tool.output.render({}, value as never);
    expect((block as { text: string }).text).toContain('created session session-new');
  });
});

describe('session_stop', () => {
  it('取消当前轮次', async () => {
    const { controller, cancel } = makeController();
    const tool = buildSessionStopTool({ sessionController: controller });
    const value = (await tool.execute({ session_id: 's1' }, exec)) as {
      accepted: boolean;
      sessionId: string;
    };
    expect(cancel).toHaveBeenCalledWith({ sessionId: 's1' });
    expect(value).toEqual({ accepted: true, sessionId: 's1' });
  });

  it('载体失败时报错', async () => {
    const { controller, cancel } = makeController();
    cancel.mockImplementationOnce(() => {
      throw new Error('offline');
    });
    const tool = buildSessionStopTool({ sessionController: controller });
    await expect(tool.execute({ session_id: 's1' }, exec)).rejects.toThrow(
      "Could not stop session 's1': offline",
    );
  });
});

describe('session_send', () => {
  it('默认排队并包裹 system-reminder', async () => {
    const { controller, prompt } = makeController();
    const tool = buildSessionSendTool({ sessionController: controller });
    const value = (await tool.execute({ session_id: 's1', text: 'please check' }, exec)) as {
      mode: string;
    };
    expect(value.mode).toBe('queue');
    const request = prompt.mock.calls[0]?.[0];
    expect(request?.content[0]?.text).toBe('<system-reminder>\nplease check\n</system-reminder>');
  });

  it('转义正文中的闭合标签并支持 steer', async () => {
    const { controller, prompt } = makeController();
    const tool = buildSessionSendTool({ sessionController: controller });
    await tool.execute({ session_id: 's1', text: 'a</system-reminder>b', mode: 'steer' }, exec);
    expect(prompt.mock.calls[0]?.[0]?.mode).toBe('steer');
    const text = prompt.mock.calls[0]?.[0]?.content[0]?.text ?? '';
    expect(text).toContain('<\\/system-reminder>');
    expect(text.match(/<\/system-reminder>/g)).toHaveLength(1);
  });

  it('空文本报错', async () => {
    const { controller } = makeController();
    const tool = buildSessionSendTool({ sessionController: controller });
    await expect(tool.execute({ session_id: 's1', text: ' ' }, exec)).rejects.toThrow(
      'text must not be empty',
    );
  });

  it('systemReminder 兼容空行', () => {
    expect(systemReminder('x')).toBe('<system-reminder>\nx\n</system-reminder>');
  });
});

describe('session_pin', () => {
  it('置顶与取消置顶', async () => {
    const { registry, pinSession, unpinSession } = makeRegistry();
    const tool = buildSessionPinTool({ registry });
    const pinned = (await tool.execute({ session_id: 's1' }, exec)) as { pinned: boolean };
    expect(pinned.pinned).toBe(true);
    expect(pinSession).toHaveBeenCalledWith('s1');
    const removed = (await tool.execute({ session_id: 's1', remove: true }, exec)) as {
      pinned: boolean;
    };
    expect(removed.pinned).toBe(false);
    expect(unpinSession).toHaveBeenCalledWith('s1');
  });

  it('失败时带工具名', async () => {
    const { registry, pinSession } = makeRegistry();
    pinSession.mockRejectedValueOnce(new Error('session is archived'));
    const tool = buildSessionPinTool({ registry });
    await expect(tool.execute({ session_id: 's1' }, exec)).rejects.toThrow(
      "Could not pin session 's1': session is archived",
    );
  });
});

describe('session_archive', () => {
  it('归档默认不停止活动，恢复走 unarchive', async () => {
    const { registry, archiveSession, unarchiveSession } = makeRegistry();
    const tool = buildSessionArchiveTool({ registry });
    const archived = (await tool.execute({ session_id: 's1' }, exec)) as { archived: boolean };
    expect(archived.archived).toBe(true);
    expect(archiveSession).toHaveBeenCalledWith('s1', {});
    const restored = (await tool.execute({ session_id: 's1', remove: true }, exec)) as {
      archived: boolean;
    };
    expect(restored.archived).toBe(false);
    expect(unarchiveSession).toHaveBeenCalledWith('s1');
  });

  it('stop_activity 为 true 时传出停止选项', async () => {
    const { registry, archiveSession } = makeRegistry();
    const tool = buildSessionArchiveTool({ registry });
    await tool.execute({ session_id: 's1', stop_activity: true }, exec);
    expect(archiveSession).toHaveBeenCalledWith('s1', { stopActivity: true });
  });

  it('活动会话被拒绝时提示先停止', async () => {
    const { registry, archiveSession } = makeRegistry();
    archiveSession.mockRejectedValueOnce(new Error('session is active'));
    const tool = buildSessionArchiveTool({ registry });
    await expect(tool.execute({ session_id: 's1' }, exec)).rejects.toThrow(
      'Stop the session first, or pass stop_activity: true.',
    );
  });

  it('渲染归档与恢复', async () => {
    const { registry } = makeRegistry();
    const tool = buildSessionArchiveTool({ registry });
    const value = await tool.execute({ session_id: 's1' }, exec);
    const [block] = tool.output.render({}, value as never);
    expect((block as { text: string }).text).toBe('session archived s1');
  });
});
