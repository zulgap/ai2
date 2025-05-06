import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. 브랜드 생성
  const brand = await prisma.brand.create({
    data: {
      name: '블로그마케팅브랜드',
      identity: { mission: '퀄리티 높은 블로그 글 생산', guide: 'RAG와 프롬프트 활용' },
    },
  });

  // 2. 팀 생성
  const team = await prisma.team.create({
    data: {
      name: '블로그마케팅팀',
      description: '블로그 글 작성 전문팀',
      brandId: brand.id,
    },
  });

  // 3. 유저 생성 (팀장/팀원)
  const user = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: '팀장',
      password: 'hashed-password',
    },
  });

  // 4. 팀 멤버 등록
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  // 5. 문서(RAG) 생성
  const docA = await prisma.document.create({
    data: {
      title: '좋은 블로그 예시',
      content: '이 문서는 좋은 블로그 글의 예시입니다.',
      brandId: brand.id,
      teamId: team.id,
      metadata: { guide: '좋은 예', prompt: '이런 식으로 작성하세요.' },
    },
  });
  const docB = await prisma.document.create({
    data: {
      title: '나쁜 블로그 예시',
      content: '이 문서는 나쁜 블로그 글의 예시입니다.',
      brandId: brand.id,
      teamId: team.id,
      metadata: { guide: '나쁜 예', prompt: '이런 식은 피하세요.' },
    },
  });

  // 문서간 관계 프롬프터 추가
  await prisma.document.update({
    where: { id: docA.id },
    data: {
      relations: {
        related: [
          {
            docId: docB.id,
            type: 'bad_example',
            prompt: '이 문서는 나쁜 예시이니 참고하지 마세요.',
          },
        ],
        summary: '좋은 예시만 참고하세요.',
      },
    },
  });
  await prisma.document.update({
    where: { id: docB.id },
    data: {
      relations: {
        related: [
          {
            docId: docA.id,
            type: 'good_example',
            prompt: '이 문서는 좋은 예시입니다.',
          },
        ],
        summary: '이 문서는 참고하지 마세요.',
      },
    },
  });

  // 6. 범용 에이전트들 생성
  const agent1 = await prisma.agent.create({
    data: {
      name: '기획 에이전트',
      description: '블로그 기획 담당',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '블로그 기획을 작성하세요.',
      type: 'worker',
      role: 'ASSISTANT',
      isPublic: true,
    },
  });

  const agent2 = await prisma.agent.create({
    data: {
      name: '서론 에이전트',
      description: '블로그 서론 작성 담당',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '블로그 서론을 작성하세요.',
      type: 'worker',
      role: 'ASSISTANT',
      isPublic: true,
    },
  });

  const agent3 = await prisma.agent.create({
    data: {
      name: '본론 에이전트',
      description: '블로그 본론 작성 담당',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '블로그 본론을 작성하세요.',
      type: 'worker',
      role: 'ASSISTANT',
      isPublic: false,
    },
  });

  // 6-1. 서론 노드리더 에이전트(특수 역할) 생성
  const introNodeLeader = await prisma.agent.create({
    data: {
      name: '서론 노드리더',
      description: '서론을 2배로 늘리라는 특수 지침',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '서론을 반드시 2배로 늘려서 작성하세요.',
      type: 'node-leader',
      role: 'SYSTEM',
      identity: { special: '서론 확장 담당' },
      isPublic: false,
    },
  });

  // 6-2. 본론 노드리더 에이전트(특수 역할) 생성
  const bodyNodeLeader = await prisma.agent.create({
    data: {
      name: '본론 노드리더',
      description: '본론에 예시를 반드시 3개 이상 넣으라는 특수 지침',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '본론에는 반드시 예시를 3개 이상 포함하세요.',
      type: 'node-leader',
      role: 'SYSTEM',
      identity: { special: '본론 예시 담당' },
      isPublic: false,
    },
  });

  // 7. 팀장 에이전트 생성
  const leaderAgent = await prisma.agent.create({
    data: {
      name: '팀장 에이전트',
      description: '팀 전체를 총괄',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '팀장으로서 각 단계별 결과를 검토하고 피드백하세요.',
      type: 'leader',
      role: 'SYSTEM',
      identity: {
        mission: '고퀄의 블로그를 만들어낸다',
        guide: '팀원들과 협업하여 최고의 결과물을 만든다',
      },
      isPublic: true,
    },
  });

  // 반드시 object로 보장
  let baseIdentity: any = leaderAgent.identity ?? {
    mission: '고퀄의 블로그를 만들어낸다',
    guide: '팀원들과 협업하여 최고의 결과물을 만든다',
  };
  if (typeof baseIdentity === 'string') {
    try {
      baseIdentity = JSON.parse(baseIdentity);
    } catch {
      baseIdentity = {};
    }
  }

  // 서론 팀장에이전트 (parentAgentId로 상속)
  const leaderIntro = await prisma.agent.create({
    data: {
      name: '서론 팀장에이전트',
      description: '서론을 총괄',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '서론을 작성하세요.',
      type: 'leader',
      role: 'SYSTEM',
      parentAgentId: leaderAgent.id,
      identity: {
        ...baseIdentity,
        subMission: '서론은 300자 이상, 흡입력 있게 작성',
      },
      isPublic: false,
    },
  });

  // 결론 팀장에이전트 (parentAgentId로 상속)
  const leaderConclusion = await prisma.agent.create({
    data: {
      name: '결론 팀장에이전트',
      description: '결론을 총괄',
      userId: user.id,
      teamId: team.id,
      config: {},
      ragDocs: [docA.id, docB.id],
      prompt: '결론은 서론/본론/결론의 톤을 유지하고 CTA가 잘 반영되어야 한다.',
      type: 'leader',
      role: 'SYSTEM',
      parentAgentId: leaderAgent.id,
      identity: {
        ...baseIdentity,
        subMission: '결론은 전체 톤을 유지하며 CTA가 명확해야 한다.',
      },
      isPublic: false,
    },
  });

  // 8-1. 싱글팀장(팀장에이전트 기준) 워크플로우
  const singleWorkflow = await prisma.workflow.create({
    data: {
      name: '블로그 작성 워크플로우(팀장에이전트 기준)',
      description: '팀장에이전트가 모든 단계를 총괄',
      userId: user.id,
      teamId: team.id,
      teamLeaderType: 'SINGLE',
      leaderAgentId: leaderAgent.id,
      config: {},
      isPublic: true,
    },
  });
  await prisma.node.create({
    data: {
      type: '기획',
      name: '기획 단계',
      position: { x: 0, y: 0 },
      data: {},
      workflowId: singleWorkflow.id,
      leaderAgentId: leaderAgent.id,
    },
  });
  await prisma.node.create({
    data: {
      type: '서론',
      name: '서론 단계',
      position: { x: 1, y: 0 },
      data: {},
      workflowId: singleWorkflow.id,
      leaderAgentId: leaderAgent.id,
    },
  });
  await prisma.node.create({
    data: {
      type: '본론',
      name: '본론 단계',
      position: { x: 2, y: 0 },
      data: {},
      workflowId: singleWorkflow.id,
      leaderAgentId: leaderAgent.id,
    },
  });

  // 8-2. 멀티팀장(노드리더 기준) 워크플로우
  const multiWorkflow = await prisma.workflow.create({
    data: {
      name: '블로그 작성 워크플로우(노드리더 기준)',
      description: '각 단계별 노드리더가 리더',
      userId: user.id,
      teamId: team.id,
      teamLeaderType: 'MULTI',
      leaderAgentId: leaderAgent.id,
      config: {},
      isPublic: false,
    },
  });
  await prisma.node.create({
    data: {
      type: '기획',
      name: '기획 단계',
      position: { x: 0, y: 0 },
      data: {},
      workflowId: multiWorkflow.id,
      leaderAgentId: agent1.id,
    },
  });
  await prisma.node.create({
    data: {
      type: '서론',
      name: '서론 단계',
      position: { x: 1, y: 0 },
      data: {},
      workflowId: multiWorkflow.id,
      leaderAgentId: introNodeLeader.id,
    },
  });
  await prisma.node.create({
    data: {
      type: '본론',
      name: '본론 단계',
      position: { x: 2, y: 0 },
      data: {},
      workflowId: multiWorkflow.id,
      leaderAgentId: bodyNodeLeader.id,
    },
  });

  // 9. 챗봇 대화/메시지 예시 데이터
  const conversation = await prisma.conversation.create({
    data: {
      title: '블로그 작성 상담',
      userId: user.id,
      agentId: leaderAgent.id,
    },
  });

  // createMany에서 createdAt/updatedAt 제거
  await prisma.message.createMany({
    data: [
      {
        content: '블로그 글을 어떻게 시작해야 할까요?',
        role: 'USER',
        conversationId: conversation.id,
      },
      {
        content: '서론에서는 독자의 관심을 끌 수 있는 문장으로 시작해보세요.',
        role: 'ASSISTANT',
        conversationId: conversation.id,
      },
    ],
  });

  console.log('예시 데이터(챗봇/createdAt/isPublic 포함) 입력 완료!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());