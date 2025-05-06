import { PrismaClient } from '@prisma/client';

// zulagap-ai-backendcd/prisma/seed.test.ts

const prisma = new PrismaClient();

describe('workflowExecution (execution1) 생성 테스트', () => {
  let user: any, agent: any, workflow: any, agentSession: any, execution: any;

  beforeAll(async () => {
    // 테스트용 user, agent, workflow, agentSession 생성
    user = await prisma.user.create({
      data: {
        email: 'test@ai.com',
        name: '테스트유저',
        password: 'pw',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    agent = await prisma.agent.create({
      data: {
        name: '테스트에이전트',
        userId: user.id,
        teamId: null,
        brandId: null,
        config: {},
        isPublic: true,
        identity: {},
        role: 'SYSTEM',
        parentAgentId: null,
        ragDocs: [],
        prompt: '',
        model: '',
        temperature: 0.5,
        type: 'leader',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
      },
    });
    workflow = await prisma.workflow.create({
      data: {
        name: '테스트 워크플로우',
        description: '',
        userId: user.id,
        teamId: null,
        brandId: null,
        agentId: agent.id,
        leaderAgentId: agent.id,
        isPublic: true,
        config: {},
        teamLeaderType: 'SINGLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    agentSession = await prisma.agentSession.create({
      data: {
        agentId: agent.id,
        userId: user.id,
        messages: [],
        variables: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        userId: user.id,
        agentSessionId: agentSession.id,
        status: 'COMPLETED',
        input: { 요청: '블로그 글 작성' },
        output: { 결과: '블로그 글이 작성되었습니다.' },
        error: null,
        logs: [{ step: '기획', status: '완료' }],
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // 생성한 데이터 정리
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.workflowExecution.deleteMany({});
    await prisma.agentSession.deleteMany({});
    await prisma.workflow.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('execution1이 올바르게 생성된다', async () => {
    const found = await prisma.workflowExecution.findUnique({
      where: { id: execution.id },
    });
    expect(found).not.toBeNull();
    expect(found?.workflowId).toBe(workflow.id);
    expect(found?.userId).toBe(user.id);
    expect(found?.status).toBe('COMPLETED');
    expect(found?.input).toEqual({ 요청: '블로그 글 작성' });
    expect(found?.output).toEqual({ 결과: '블로그 글이 작성되었습니다.' });
    expect(found?.logs).toEqual([{ step: '기획', status: '완료' }]);
    expect(found?.startedAt).toBeInstanceOf(Date);
    expect(found?.endedAt).toBeInstanceOf(Date);
  });
});
describe('session1 생성 테스트', () => {
  let user: any, agent: any, session: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: 'sessiontest@ai.com',
        name: '세션유저',
        password: 'pw',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    agent = await prisma.agent.create({
      data: {
        name: '세션에이전트',
        userId: user.id,
        teamId: null,
        brandId: null,
        config: {},
        isPublic: true,
        identity: {},
        role: 'SYSTEM',
        parentAgentId: null,
        ragDocs: [],
        prompt: '',
        model: '',
        temperature: 0.5,
        type: 'leader',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
      },
    });
    session = await prisma.session.create({
      data: {
        agentId: agent.id,
        question: '테스트 질문',
        answer: '테스트 답변',
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('session1이 올바르게 생성된다', async () => {
    const found = await prisma.session.findUnique({
      where: { id: session.id },
    });
    expect(found).not.toBeNull();
    expect(found?.agentId).toBe(agent.id);
    expect(found?.question).toBe('테스트 질문');
    expect(found?.answer).toBe('테스트 답변');
    expect(found?.createdAt).toBeInstanceOf(Date);
  });
});
describe('session1 시드 데이터 생성 테스트', () => {
  let user: any, agent: any, session: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: 'sessionseed@ai.com',
        name: '시드세션유저',
        password: 'pw',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    agent = await prisma.agent.create({
      data: {
        name: '시드세션에이전트',
        userId: user.id,
        teamId: null,
        brandId: null,
        config: {},
        isPublic: true,
        identity: {},
        role: 'SYSTEM',
        parentAgentId: null,
        ragDocs: [],
        prompt: '',
        model: '',
        temperature: 0.5,
        type: 'leader',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
      },
    });
    session = await prisma.session.create({
      data: {
        agentId: agent.id,
        question: '시드 테스트 질문',
        answer: '시드 테스트 답변',
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('session1이 시드 데이터대로 생성된다', async () => {
    const found = await prisma.session.findUnique({
      where: { id: session.id },
    });
    expect(found).not.toBeNull();
    expect(found?.agentId).toBe(agent.id);
    expect(found?.question).toBe('시드 테스트 질문');
    expect(found?.answer).toBe('시드 테스트 답변');
    expect(found?.createdAt).toBeInstanceOf(Date);
  });
});