import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/external/naver-news';

export async function POST(request: NextRequest) {
  try {
    const { query, display = 5, sort = 'date' } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'query 필수' }, { status: 400 });
    }
    const results = await searchNews(query, display, sort);
    return NextResponse.json(results);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
