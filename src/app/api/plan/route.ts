import { NextRequest, NextResponse } from 'next/server';
import { saveAnnualPlan, loadAnnualPlan } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get('year'));
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
  if (!year) {
    return NextResponse.json({ error: 'year 필수' }, { status: 400 });
  }
  try {
    const data = await loadAnnualPlan(year, month);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, items } = body;
    if (!year || !month || !items) {
      return NextResponse.json({ error: 'year, month, items 필수' }, { status: 400 });
    }
    await saveAnnualPlan(year, month, items);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
