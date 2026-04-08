// ============================================================
// 다나와 자동차 판매현황 스크래핑 — danawa_scraper.py 포팅
// 서버사이드 전용 (API Route에서 호출)
// ============================================================

import * as cheerio from 'cheerio';

const MODEL_MAKER: Record<string, string> = {
  '쏘렌토': '기아', '그랜저': '현대', '소나타 디 엣지': '현대', '소나타': '현대',
  '스포티지': '기아', '카니발': '기아', '아반떼': '현대', '셀토스': '기아',
  '디 올 뉴 셀토스': '기아', '필랑트': '르노코리아', '포터2': '현대', '포터': '현대',
  'EV3': '기아', '투싼': '현대', 'G80': '현대', '코나': '현대',
  '싼타페': '현대', '팰리세이드': '현대', 'K8': '기아', '모닝': '기아',
  '레이': '기아', '봉고3': '기아', '스타리아': '현대', '캐스퍼': '현대',
  'GV70': '현대', 'GV80': '현대', 'G70': '현대', 'G90': '현대',
  '아이오닉5': '현대', '아이오닉 5': '현대', '아이오닉6': '현대', '아이오닉 6': '현대',
  'EV6': '기아', 'EV9': '기아', '니로': '기아',
  '트레일블레이저': '한국GM', '트랙스 크로스오버': '한국GM', '이쿼녹스': '한국GM',
  '콜로라도': '한국GM', '타호': '한국GM',
  '그랑 콜레오스': '르노코리아', '아르카나': '르노코리아', 'QM6': '르노코리아',
  'XM3': '르노코리아', '폴스타4': '르노코리아',
  '토레스': 'KG모빌리티', '티볼리': 'KG모빌리티', '코란도': 'KG모빌리티',
  '렉스턴': 'KG모빌리티', '액티언': 'KG모빌리티',
};

const MAKER_NORMALIZE: Record<string, string> = {
  '현대': '현대', '기아': '기아', '한국GM': 'GM',
  '르노코리아': '르노코리아', 'KG모빌리티': 'KG모빌리티',
};

export interface DanawaTop10 {
  rank: number;
  model: string;
  maker: string;
  sales: number;
}

export interface DanawaResult {
  top10: DanawaTop10[];
  marketShare: Record<string, number>;
  totalSales: number;
}

export async function scrapeDanawa(year: number, month: number): Promise<DanawaResult> {
  const url =
    `https://auto.danawa.com/newcar/?Work=record&Tab=Grand` +
    `&Classify=~C,PC1,PC2,PC3,PC4,PC5,PS~,RU2,RU3,RU5,RM~,O~` +
    `&Month=${year}-${String(month).padStart(2, '0')}-00&MonthTo=`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const allModels: { rank: number; model: string; maker: string; sales: number }[] = [];

    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length < 5) return;

      const rankText = $(tds[1]).text().trim();
      if (!/^\d+$/.test(rankText)) return;

      const rank = parseInt(rankText, 10);
      const modelName = $(tds[3]).text().trim();

      // 판매량: "10,870그래프로 보기" → 10870
      const salesRaw = $(tds[4]).text().trim();
      const salesNum = salesRaw.split('그')[0].replace(/[^0-9]/g, '');
      const sales = salesNum ? parseInt(salesNum, 10) : 0;

      // 제조사 매핑
      let maker = '기타';
      for (const [key, val] of Object.entries(MODEL_MAKER)) {
        if (modelName.includes(key)) {
          maker = val;
          break;
        }
      }

      allModels.push({ rank, model: modelName, maker, sales });
    });

    const top10 = allModels.filter((m) => m.rank <= 10);

    // 제조사별 합산
    const makerTotals: Record<string, number> = {};
    for (const m of allModels) {
      const norm = MAKER_NORMALIZE[m.maker] ?? m.maker;
      makerTotals[norm] = (makerTotals[norm] ?? 0) + m.sales;
    }

    const totalSales = Object.values(makerTotals).reduce((a, b) => a + b, 0);

    const marketShare: Record<string, number> = {};
    if (totalSales > 0) {
      for (const [mk, sv] of Object.entries(makerTotals)) {
        marketShare[mk] = Math.round((sv / totalSales) * 1000) / 10;
      }
    }

    return { top10, marketShare, totalSales };
  } catch {
    return { top10: [], marketShare: {}, totalSales: 0 };
  }
}
