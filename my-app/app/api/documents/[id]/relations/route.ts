import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const res = await fetch(`${BACKEND_URL}/documents/${id}/relations`, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}