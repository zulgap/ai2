import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 워크플로우 목록 조회
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('[API][GET] 백엔드 응답 에러:', res.status, res.statusText);
      return NextResponse.json({ error: '백엔드 GET 요청 실패', status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : (data.workflows || data.data || []));
  } catch (err: any) {
    console.error('[API][GET] 예외 발생:', err?.message || err);
    return NextResponse.json({ error: 'API GET 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

// 워크플로우 생성
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[API][POST] 백엔드 응답 에러:', res.status, res.statusText, errorData);
      return NextResponse.json({ error: '백엔드 POST 요청 실패', detail: errorData, status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API][POST] 예외 발생:', err?.message || err);
    return NextResponse.json({ error: 'API POST 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

// 워크플로우 수정 (PATCH)
export async function PATCH(req: NextRequest) {
  const { id, ...body } = await req.json();
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[API][PATCH] 백엔드 응답 에러:', res.status, res.statusText, errorData);
      return NextResponse.json({ error: '백엔드 PATCH 요청 실패', detail: errorData, status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API][PATCH] 예외 발생:', err?.message || err);
    return NextResponse.json({ error: 'API PATCH 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

// 워크플로우 삭제
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[API][DELETE] 백엔드 응답 에러:', res.status, res.statusText, errorData);
      return NextResponse.json({ error: '백엔드 DELETE 요청 실패', detail: errorData, status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API][DELETE] 예외 발생:', err?.message || err);
    return NextResponse.json({ error: 'API DELETE 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}