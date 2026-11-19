// 会话操作测试：新建、停止、发送提醒、置顶与归档。
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm';
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
  Agent,
  LlmLike,
  SessionAgentResultLike,
  SessionControllerLike,
  SessionCreateRequestLike,
  SubagentsLike,
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
  const prompt = vi.fn();
  const steer = vi.fn();
  const select = vi.fn();
  const selectModel = vi.fn();
  const agent = { steer, model: { select } } as unknown as Agent;
  const resolveAgent = vi.fn(
    async (_sessionId: string): Promise<SessionAgentResultLike> => ({ agent }),
  );
  const cancel = vi.fn((_request: { sessionId: string }) => ({ accepted: true as const }));
  const controller = {
    create,
    rename,
    prompt,
    resolveAgent,
    cancel,
    selectModel,
  } as unknown as SessionControllerLike & {
    prompt: typeof prompt;
    selectModel: typeof selectModel;
  };
  return {
    controller,
    create,
    rename,
    prompt,
    resolveAgent,
    steer,
    select,
    agent,
    cancel,
    selectModel,
  };
}

/** 假模型运行时。 */
function makeLlm() {
  const resolveCallConfig = vi.fn(
    async (config: Parameters<LlmLike['resolveCallConfig']>[0]) => config,
  );
  const llm: LlmLike = { resolveCallConfig };
  return { llm, resolveCallConfig };
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

/** 带子代理路由服务的调用方。 */
function execWithSubagents(subagents: SubagentsLike) {
  return {
    signal: new AbortController().signal,
    agent: {
      session: { id: 'caller' },
      ctx: { get: (name: string) => (name === 'subagents' ? subagents : undefined) },
    },
  } as never;
}

describe('session_create', () => {
  it('按位置、预设、标题与插件来源的首条插话创建会话', async () => {
    const { controller, create, rename, resolveAgent, steer, prompt } = makeController();
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
    expect(resolveAgent).toHaveBeenCalledWith('session-new');
    expect(steer).toHaveBeenCalledOnce();
    expect(steer.mock.calls[0]?.[0]).toMatchObject({
      id: expect.any(String),
      role: 'user',
      source: { kind: 'dsh-plugin-meta-tools' },
      content: [{ type: 'text', text: 'hello' }],
    });
    expect(prompt).not.toHaveBeenCalled();
    expect(value).toMatchObject({
      sessionId: 'session-new',
      agentPreset: 'standard',
      title: '新会话',
      prompted: true,
    });
  });

  it('完整模型选择先校验再创建，并在标题和首条消息前选择会话模型', async () => {
    const { controller, create, rename, resolveAgent, steer, select, selectModel } =
      makeController();
    const { llm, resolveCallConfig } = makeLlm();
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await tool.execute(
      {
        provider: ' acme ',
        model: ' alpha ',
        effort: ' high ',
        title: '模型会话',
        prompt: 'hello',
      },
      exec,
    );

    expect(resolveCallConfig.mock.calls[0]?.[0]).toStrictEqual({
      provider: 'acme',
      model: 'alpha',
      reasoningEffort: 'high',
    });
    expect(create).toHaveBeenCalledWith({});
    expect(resolveAgent).toHaveBeenCalledWith('session-new');
    expect(select).toHaveBeenCalledWith({
      provider: 'acme',
      model: 'alpha',
      reasoningEffort: 'high',
    });
    expect(rename).toHaveBeenCalledWith({ sessionId: 'session-new', title: '模型会话' });
    expect(steer).toHaveBeenCalledOnce();
    expect(selectModel).not.toHaveBeenCalled();
    expect(resolveCallConfig.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0] ?? 0,
    );
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      resolveAgent.mock.invocationCallOrder[0] ?? 0,
    );
    expect(resolveAgent.mock.invocationCallOrder[0]).toBeLessThan(
      select.mock.invocationCallOrder[0] ?? 0,
    );
    expect(select.mock.invocationCallOrder[0]).toBeLessThan(rename.mock.invocationCallOrder[0] ?? 0);
    expect(rename.mock.invocationCallOrder[0]).toBeLessThan(steer.mock.invocationCallOrder[0] ?? 0);
  });

  it('省略 effort 时不传 reasoningEffort', async () => {
    const { controller, select, selectModel } = makeController();
    const { llm, resolveCallConfig } = makeLlm();
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await tool.execute({ provider: 'acme', model: 'alpha' }, exec);

    expect(resolveCallConfig.mock.calls[0]?.[0]).toStrictEqual({
      provider: 'acme',
      model: 'alpha',
    });
    expect(select.mock.calls[0]?.[0]).toStrictEqual({ provider: 'acme', model: 'alpha' });
    expect(select.mock.calls[0]?.[0]).not.toHaveProperty('reasoningEffort');
    expect(selectModel).not.toHaveBeenCalled();
  });

  it('省略工具参数时使用插件默认模型', async () => {
    const { controller, select } = makeController();
    const { llm, resolveCallConfig } = makeLlm();
    const tool = buildSessionCreateTool({
      sessionController: controller,
      llm,
      defaultModel: {
        provider: 'acme',
        model: 'alpha',
        reasoningEffort: ReasoningEffortId('high'),
      },
    });

    await tool.execute({}, exec);

    expect(resolveCallConfig.mock.calls[0]?.[0]).toEqual({
      provider: 'acme',
      model: 'alpha',
      reasoningEffort: 'high',
    });
    expect(select).toHaveBeenCalledWith({
      provider: 'acme',
      model: 'alpha',
      reasoningEffort: 'high',
    });
  });

  it('显式工具参数覆盖插件默认模型且不与默认 effort 合并', async () => {
    const { controller, select } = makeController();
    const { llm } = makeLlm();
    const tool = buildSessionCreateTool({
      sessionController: controller,
      llm,
      defaultModel: {
        provider: 'acme',
        model: 'alpha',
        reasoningEffort: ReasoningEffortId('high'),
      },
    });

    await tool.execute({ provider: 'other', model: 'beta' }, exec);

    expect(select).toHaveBeenCalledWith({ provider: 'other', model: 'beta' });
    expect(select.mock.calls[0]?.[0]).not.toHaveProperty('reasoningEffort');
  });

  it.each([
    { label: '省略参数', args: {} },
    {
      label: '空白参数',
      args: { provider: ' \t', model: '\n', effort: ' ' },
    },
  ])('未提供有效模型参数时保持默认流程：$label', async ({ args }) => {
    const { controller, resolveAgent, steer, select, selectModel } = makeController();
    const { llm, resolveCallConfig } = makeLlm();
    resolveAgent.mockResolvedValueOnce({ agent: { steer } as unknown as Agent });
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await expect(tool.execute({ ...args, prompt: 'hello' }, exec)).resolves.toMatchObject({
      prompted: true,
    });
    expect(resolveCallConfig).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(selectModel).not.toHaveBeenCalled();
    expect(steer).toHaveBeenCalledOnce();
  });

  it.each([
    { label: '只有 provider', args: { provider: 'acme' } },
    { label: '只有 model', args: { model: 'alpha' } },
    { label: '只有 effort', args: { effort: 'high' } },
    { label: '缺少 model', args: { provider: 'acme', effort: 'high' } },
    { label: '缺少 provider', args: { model: 'alpha', effort: 'high' } },
  ])('不完整模型组合在创建前报错：$label', async ({ args }) => {
    const { controller, create, rename, resolveAgent, steer } = makeController();
    const { llm, resolveCallConfig } = makeLlm();
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await expect(tool.execute(args, exec)).rejects.toThrow();
    expect(resolveCallConfig).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
  });

  it('模型校验服务缺失时不创建会话', async () => {
    const { controller, create, resolveAgent, rename, steer } = makeController();
    const tool = buildSessionCreateTool({ sessionController: controller, llm: undefined });

    await expect(tool.execute({ provider: 'acme', model: 'alpha' }, exec)).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
  });

  it('模型校验失败时不创建会话', async () => {
    const { controller, create, resolveAgent, rename, steer } = makeController();
    const { llm, resolveCallConfig } = makeLlm();
    resolveCallConfig.mockRejectedValueOnce(new Error('unsupported route'));
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await expect(
      tool.execute({ provider: 'acme', model: 'alpha', effort: 'high' }, exec),
    ).rejects.toThrow('unsupported route');
    expect(create).not.toHaveBeenCalled();
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
  });

  it('创建后解析 Agent 失败时报告会话 id 并停止后续操作', async () => {
    const { controller, create, resolveAgent, select, rename, steer } = makeController();
    const { llm } = makeLlm();
    resolveAgent.mockResolvedValueOnce({ error: new Error('agent unavailable') });
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await expect(
      tool.execute(
        { provider: 'acme', model: 'alpha', title: '不会设置', prompt: '不会发送' },
        exec,
      ),
    ).rejects.toThrow(/session-new.*agent unavailable/);
    expect(create).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
  });

  it('创建后选择模型失败时报告会话 id 并停止后续操作', async () => {
    const { controller, create, resolveAgent, select, rename, steer } = makeController();
    const { llm } = makeLlm();
    select.mockImplementationOnce(() => {
      throw new Error('selection failed');
    });
    const tool = buildSessionCreateTool({ sessionController: controller, llm });

    await expect(
      tool.execute(
        { provider: 'acme', model: 'alpha', title: '不会设置', prompt: '不会发送' },
        exec,
      ),
    ).rejects.toThrow(/session-new.*selection failed/);
    expect(create).toHaveBeenCalledOnce();
    expect(resolveAgent).toHaveBeenCalledWith('session-new');
    expect(rename).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
  });

  it('已取消调用不解析或投递首条消息', async () => {
    const { controller, resolveAgent, steer, prompt } = makeController();
    const aborter = new AbortController();
    aborter.abort();
    const tool = buildSessionCreateTool({ sessionController: controller });

    await expect(
      tool.execute({ prompt: 'hello' }, { signal: aborter.signal } as never),
    ).rejects.toThrow(/aborted/i);
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('不带首条消息时保持空白会话', async () => {
    const { controller, prompt, resolveAgent, steer } = makeController();
    const tool = buildSessionCreateTool({ sessionController: controller });

    await expect(tool.execute({}, exec)).resolves.toMatchObject({ prompted: false });
    expect(prompt).not.toHaveBeenCalled();
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
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

  it('首条消息解析失败时带出新会话 id', async () => {
    const { controller, resolveAgent, steer, prompt } = makeController();
    resolveAgent.mockResolvedValueOnce({ error: new Error('session archived') });
    const tool = buildSessionCreateTool({ sessionController: controller });
    await expect(tool.execute({ prompt: 'hello' }, exec)).rejects.toThrow(
      "The session 'session-new' was created, but its first prompt failed: session archived",
    );
    expect(steer).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
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

  it('subagent 会话走 interrupt 路由', async () => {
    const { controller, cancel } = makeController();
    cancel.mockImplementationOnce(() => {
      throw new Error('session "s1" is owned by subagent routing');
    });
    const interrupt = vi.fn();
    const tool = buildSessionStopTool({ sessionController: controller });
    const exec = execWithSubagents({ interrupt });
    await tool.execute({ session_id: 's1' }, exec);
    expect(interrupt).toHaveBeenCalledWith('s1', {
      kind: 'ancestor',
      agent: (exec as { agent: unknown }).agent,
    });
  });
});

describe('session_send', () => {
  it('固定以插件来源插话并包裹 system-reminder', async () => {
    const { controller, resolveAgent, steer, prompt } = makeController();
    const tool = buildSessionSendTool({ sessionController: controller });
    const value = await tool.execute({ session_id: 's1', text: 'please check' }, exec);
    expect(value).toEqual({ delivered: true, sessionId: 's1' });
    expect(tool.output.render({}, value)).toEqual([
      { type: 'text', text: 'system reminder delivered to session s1' },
    ]);
    expect(resolveAgent).toHaveBeenCalledWith('s1');
    expect(steer).toHaveBeenCalledOnce();
    expect(steer.mock.calls[0]?.[0]).toMatchObject({
      id: expect.any(String),
      role: 'user',
      source: { kind: 'dsh-plugin-meta-tools' },
      content: [{ type: 'text', text: '<system-reminder>\nplease check\n</system-reminder>' }],
    });
    expect(prompt).not.toHaveBeenCalled();
  });

  it('转义正文中的闭合标签', async () => {
    const { controller, steer, prompt } = makeController();
    const tool = buildSessionSendTool({ sessionController: controller });
    await tool.execute({ session_id: 's1', text: 'a</system-reminder>b' }, exec);
    const message = steer.mock.calls[0]?.[0];
    const text = message?.content[0]?.text ?? '';
    expect(text).toContain('<\\/system-reminder>');
    expect(text.match(/<\/system-reminder>/g)).toHaveLength(1);
    expect(message?.source).toEqual({ kind: 'dsh-plugin-meta-tools' });
    expect(prompt).not.toHaveBeenCalled();
  });

  it('调用前取消时不解析目标', async () => {
    const { controller, resolveAgent, steer, prompt } = makeController();
    const aborter = new AbortController();
    aborter.abort();
    const tool = buildSessionSendTool({ sessionController: controller });

    await expect(
      tool.execute({ session_id: 's1', text: 'reminder' }, { signal: aborter.signal } as never),
    ).rejects.toThrow(/aborted/i);
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('解析期间取消时不执行插话', async () => {
    const { controller, resolveAgent, steer, agent, prompt } = makeController();
    const aborter = new AbortController();
    resolveAgent.mockImplementationOnce(async () => {
      aborter.abort();
      return { agent };
    });
    const tool = buildSessionSendTool({ sessionController: controller });

    await expect(
      tool.execute({ session_id: 's1', text: 'reminder' }, { signal: aborter.signal } as never),
    ).rejects.toThrow(/aborted/i);
    expect(steer).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('subagent 归属错误不切换其他来源投递', async () => {
    const { controller, resolveAgent, steer, prompt } = makeController();
    resolveAgent.mockResolvedValueOnce({
      error: new Error('session "s1" is owned by subagent routing'),
    });
    const sendMessage = vi.fn(async () => 'message-1');
    const subagents = { interrupt: vi.fn(), sendMessage };
    const tool = buildSessionSendTool({ sessionController: controller });
    const execution = execWithSubagents(subagents);

    await expect(tool.execute({ session_id: 's1', text: 'reminder' }, execution)).rejects.toThrow(
      "Could not deliver the reminder to session 's1':",
    );
    expect(sendMessage).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('空文本报错且不解析目标', async () => {
    const { controller, resolveAgent, steer, prompt } = makeController();
    const tool = buildSessionSendTool({ sessionController: controller });
    await expect(tool.execute({ session_id: 's1', text: ' ' }, exec)).rejects.toThrow(
      'text must not be empty',
    );
    expect(resolveAgent).not.toHaveBeenCalled();
    expect(steer).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
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
