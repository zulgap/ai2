import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { workflowId: string; nodeId: string } }
) {
  const { output, feedback, status } = await request.json();

  // 노드 데이터 업데이트 (예시: data 필드에 결과/피드백 저장)
  const node = await prisma.node.update({
    where: { id: params.nodeId },
    data: {
      data: {
        output,
        feedback,
        status,
      },
    },
  });
  return NextResponse.json(node);
}