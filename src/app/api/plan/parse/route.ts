import { NextRequest, NextResponse } from 'next/server';
import { parsePlanExcel } from '@/lib/excel/plan-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parsePlanExcel(buffer);

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `파싱 실패: ${msg}` }, { status: 500 });
  }
}
