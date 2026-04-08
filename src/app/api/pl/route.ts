import { NextRequest, NextResponse } from 'next/server';
import { saveMonthlyPL, loadMonthlyPL } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  if (!year || !month) {
    return NextResponse.json({ error: 'year, month 필수' }, { status: 400 });
  }
  try {
    const data = await loadMonthlyPL(year, month);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, data } = body;
    if (!year || !month || !data) {
      return NextResponse.json({ error: 'year, month, data 필수' }, { status: 400 });
    }
    await saveMonthlyPL(year, month, data);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
