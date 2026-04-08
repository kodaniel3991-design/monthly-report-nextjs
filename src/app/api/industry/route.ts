import { NextRequest, NextResponse } from 'next/server';
import {
  saveIndustryNews, loadIndustryNews,
  saveMarketShare, loadMarketShare,
  saveTopModels, loadTopModels,
} from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  if (!year || !month) {
    return NextResponse.json({ error: 'year, month 필수' }, { status: 400 });
  }
  try {
    const [news, marketShare, topModels] = await Promise.all([
      loadIndustryNews(year, month),
      loadMarketShare(year, month),
      loadTopModels(year, month),
    ]);
    return NextResponse.json({ news, marketShare, topModels });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, news, marketShare, topModels } = body;
    if (!year || !month) {
      return NextResponse.json({ error: 'year, month 필수' }, { status: 400 });
    }
    await Promise.all([
      news ? saveIndustryNews(year, month, news) : Promise.resolve(),
      marketShare ? saveMarketShare(year, month, marketShare) : Promise.resolve(),
      topModels ? saveTopModels(year, month, topModels) : Promise.resolve(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
