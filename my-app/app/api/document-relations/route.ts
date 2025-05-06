import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function POST(req: NextRequest) {
  const data = await req.json();
  console.log('document-relations POST data:', data);

  // NestJS 백엔드로 프록시 POST 요청
  const res = await fetch(`${BACKEND_URL}/document-relations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  return NextResponse.json(result);
}

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/document-relations`);
  const data = await res.json();
  return NextResponse.json(data);
}