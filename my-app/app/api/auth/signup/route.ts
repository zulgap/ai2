import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // NestJS 백엔드 회원가입 API 엔드포인트로 요청 중계
  const backendUrl = process.env.BACKEND_URL;
  const backendRes = await fetch(`${backendUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}