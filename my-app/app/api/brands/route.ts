import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

// 브랜드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/brands`, { cache: 'no-store' }); // ← /api/brands로 수정
    if (!res.ok) {
      return NextResponse.json({ error: '브랜드 목록 조회 실패', status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : (data.brands || []));
  } catch (e) {
    return NextResponse.json({ error: '브랜드 목록 조회 중 오류', detail: String(e) }, { status: 500 });
  }
}

// 브랜드 생성
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_URL}/brands`, { // ← /api/brands로 수정
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ error: '브랜드 생성 실패', detail: msg }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: '브랜드 생성 중 오류', detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: any) {
  const { id } = params;
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ error: '브랜드 수정 실패', detail: msg }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: '브랜드 수정 중 오류', detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = params;
  try {
    // 1. 브랜드와 연결된 문서 관계(DocumentRelation)도 함께 삭제
    const docsRes = await fetch(`${BACKEND_URL}/brands/${id}`);
    if (docsRes.ok) {
      const brand = await docsRes.json();
      if (brand.documents && Array.isArray(brand.documents)) {
        for (const doc of brand.documents) {
          await fetch(`${BACKEND_URL}/document-relations/by-document/${doc.id}`, {
            method: 'DELETE',
          });
        }
      }
    }

    // 2. 브랜드 삭제
    const res = await fetch(`${BACKEND_URL}/brands/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ error: '브랜드 삭제 실패', detail: msg }, { status: res.status });
    }
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = { ok: true };
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: '브랜드 삭제 중 오류', detail: String(e) }, { status: 500 });
  }
}
