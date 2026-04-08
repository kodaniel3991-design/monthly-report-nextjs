import { NextRequest, NextResponse } from 'next/server';
import { scrapeDanawa } from '@/lib/external/danawa-scraper';

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();
    if (!year || !month) {
      return NextResponse.json({ error: 'year, month 필수' }, { status: 400 });
    }
    const result = await scrapeDanawa(year, month);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
