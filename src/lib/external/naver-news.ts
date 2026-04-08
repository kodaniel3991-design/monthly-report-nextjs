// ============================================================
// 네이버 뉴스 검색 API — naver_news.py 포팅
// 서버사이드 전용 (API Route에서 호출)
// ============================================================

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .trim();
}

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

export async function searchNews(
  query: string,
  display: number = 10,
  sort: string = 'date'
): Promise<NewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) return [];

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];
    const data = await res.json();

    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };

    return (data.items ?? []).map((item: Record<string, string>) => {
      // pubDate: "Mon, 07 Apr 2025 10:30:00 +0900" → "04.07"
      const parts = (item.pubDate ?? '').split(' ');
      let dateShort = '';
      if (parts.length >= 4) {
        const m = months[parts[2]] ?? '00';
        const d = parts[1].replace(',', '').padStart(2, '0');
        dateShort = `${m}.${d}`;
      }

      const link = item.originallink || item.link || '';
      let source = '';
      try {
        const domain = new URL(link).hostname.replace('www.', '').split('.')[0];
        source = domain;
      } catch { /* ignore */ }

      return {
        title: cleanHtml(item.title ?? ''),
        description: cleanHtml(item.description ?? ''),
        link,
        pubDate: dateShort,
        source: source ? `${dateShort} ${source}` : dateShort,
      };
    });
  } catch {
    return [];
  }
}
