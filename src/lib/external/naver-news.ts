// ============================================================
// 네이버 뉴스 검색 API + 기사 본문 스크래핑 요약
// naver_news.py 포팅 (서버사이드 전용)
// ============================================================

import * as cheerio from 'cheerio';

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
  summary: string;
}

// 불필요 라인 필터링 키워드
const SKIP_WORDS = [
  '기자', '무단전재', '저작권', 'ⓒ', '©', '제보', '구독', '댓글',
  '좋아요', '공유', '카카오', '페이스북', '트위터', 'URL', '클릭',
  '입력', '수정', '송고', '뉴스1', '연합뉴스', '사진=', '사진 =',
  '영상=', '취재=', '발행일', '등록일', '게시일',
  'MBC', 'KBS', 'SBS', 'JTBC', 'YTN', 'TV조선', '채널A',
  '참 좋다', '뉴스데스크', '앵커', '리포트',
];

/**
 * 뉴스 URL에서 본문 스크래핑 → 서술형 5줄 요약
 * 완료형 문장(~다.)으로 끝나도록 조합
 */
async function scrapeArticle(url: string, maxSentences = 5): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 불필요 태그 제거
    $('script, style, iframe, .ad, .promotion, .reporter_area, .copyright, .byline, figure, .image, .photo').remove();

    // 본문 선택자 (네이버 뉴스 + 일반 뉴스)
    const selectors = [
      '#dic_area', '#articleBodyContents', '.article_body', '#newsEndContents',
      'article', '.news_end', '#articeBody', '.article-body',
      '.article', '#content', '.post-content', '.entry-content',
    ];

    let bodyText = '';
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length) {
        bodyText = el.text();
        break;
      }
    }

    if (!bodyText) return '';

    // 문장 분리 및 필터링
    const sentences: string[] = [];
    const lines = bodyText.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (line.length < 10) continue;

      // 불필요 라인 필터링
      if (SKIP_WORDS.some((w) => line.includes(w))) continue;

      // 날짜/시간/메타 패턴 제거
      if (/^[:\s]*\d{4}\.\d{2}\.\d{2}/.test(line)) continue;
      if (/^[\d.\-:\s오전후]+$/.test(line)) continue;
      if (/\d{4}년\s*\d{1,2}월\s*\d{1,2}일/.test(line)) continue;
      if (/\d{4}-\d{2}-\d{2}\s*\(/.test(line)) continue;
      if (/^\[.+\]/.test(line)) continue;

      // 잔여 날짜/시간 제거
      line = line.replace(/:?\s*\d{4}\.\d{2}\.\d{2}\s*(오전|오후)?\s*\d{0,2}:?\d{0,2}/g, '');
      line = line.replace(/\d{2}:\d{2}\s*(오전|오후)?/g, '');
      line = line.trim().replace(/^[:\s]+/, '');
      if (line.length < 15) continue;

      // 마침표로 문장 분리 (~다. 기준)
      const parts = line.split(/(?<=다\.)\s*/);
      for (const sent of parts) {
        const s = sent.trim();
        if (s.length < 15) continue;
        if (s.endsWith('...') || s.endsWith('…')) continue;
        sentences.push(s);
      }
    }

    // 서술형 요약: 완료형 문장(~다.)으로 끝나도록 조합
    const maxChars = 34 * maxSentences; // 34자 × 5줄
    let combined = '';
    let used = 0;

    for (const sent of sentences) {
      // 중복 방지
      if (combined && sent.substring(0, 15).length > 0 && combined.includes(sent.substring(0, 15))) {
        continue;
      }
      if (combined.length + sent.length + 1 > maxChars) {
        break; // 잘리는 문장 넣지 않음 — 완료형 유지
      }
      combined += (combined ? ' ' : '') + sent;
      used++;
      if (used >= maxSentences) break;
    }

    // 완료형 문장으로 끝나지 않으면 마지막 완료형까지 자르기
    if (combined && !/[다음됨임함짐][.!]?\s*$/.test(combined)) {
      const matches = [...combined.matchAll(/[다음됨임함짐]\./g)];
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        combined = combined.substring(0, (lastMatch.index ?? 0) + lastMatch[0].length);
      }
    }

    return combined.trim();
  } catch {
    return '';
  }
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

    const items: NewsItem[] = (data.items ?? []).map((item: Record<string, string>) => {
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
        summary: '', // 아래에서 채움
      };
    });

    // 각 기사 본문 스크래핑 (병렬)
    const summaries = await Promise.all(
      items.map((item) => scrapeArticle(item.link, 5))
    );
    items.forEach((item, i) => {
      item.summary = summaries[i] || item.description;
    });

    return items;
  } catch {
    return [];
  }
}
