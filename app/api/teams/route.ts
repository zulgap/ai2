import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { name, description, brandId } = await request.json();
  if (!name || !brandId) {
    return NextResponse.json({ error: 'name, brandId required' }, { status: 400 });
  }
  const team = await prisma.team.create({
    data: { name, description, brandId },
  });
  return NextResponse.json(team);
}

export async function GET() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      brandId: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(teams);
}