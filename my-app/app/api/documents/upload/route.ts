import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  // 엔드포인트를 직접 붙여서 요청
  const res = await fetch(`${BACKEND_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data); // 반드시 id 포함
}