import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const session = await prisma.session.create({
    data: {
      agentId: body.agentId,
      question: body.question,
      answer: body.answer,
    },
  });
  return NextResponse.json(session);
}