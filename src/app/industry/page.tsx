'use client';

import { useState, useEffect } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';
import { NEWS_COMPANIES, MARKET_COMPANIES } from '@/lib/constants';
import { formatKRW } from '@/lib/format';

type NewsItem = { title: string; description: string; link: string; source: string };
type TopModel = { rank: number; model: string; maker: string; sales: number };

export default function IndustryPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 뉴스 데이터 (회사별)
  const [newsData, setNewsData] = useState<Record<string, { headline: string; content: string; source: string }[]>>({});
  const [searchResults, setSearchResults] = useState<NewsItem[]>([]);
  const [searching, setSearching] = useState(false);

  // 판매 데이터
  const [topModels, setTopModels] = useState<TopModel[]>([]);
  const [marketShare, setMarketShare] = useState<Record<string, number>>({});
  const [scraping, setScraping] = useState(false);

  // 저장된 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/industry?year=${year}&month=${month}`);
        const data = await res.json();
        if (res.ok) {
          // 뉴스
          const grouped: Record<string, { headline: string; content: string; source: string }[]> = {};
          for (const item of data.news ?? []) {
            if (!grouped[item.company]) grouped[item.company] = [];
            grouped[item.company].push({ headline: item.headline, content: item.content ?? '', source: item.source ?? '' });
          }
          setNewsData(grouped);
          // TOP10
          if (data.topModels?.length) {
            setTopModels(data.topModels.map((m: Record<string, unknown>) => ({
              rank: m.rank as number, model: m.model_name as string,
              maker: m.company as string, sales: m.sales_qty as number,
            })));
          }
          // 시장점유율
          if (data.marketShare?.length) {
            const ms: Record<string, number> = {};
            for (const m of data.marketShare) ms[m.company] = m.share_pct;
            setMarketShare(ms);
          }
        }
      } catch { /* ignore */ }
    };
    load();
  }, [year, month]);

  const handleSearch = async (company: string) => {
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch('/api/industry/naver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${company} 자동차 판매`, display: 5 }),
      });
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setSearching(false);
  };

  const addNews = (company: string, item: NewsItem) => {
    const current = newsData[company] ?? [];
    setNewsData({
      ...newsData,
      [company]: [...current, { headline: item.title, content: item.description, source: item.source }],
    });
  };

  const removeNews = (company: string, idx: number) => {
    const current = [...(newsData[company] ?? [])];
    current.splice(idx, 1);
    setNewsData({ ...newsData, [company]: current });
  };

  const handleDanawa = async () => {
    setScraping(true);
    try {
      const res = await fetch('/api/industry/danawa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json();
      if (data.top10) setTopModels(data.top10);
      if (data.marketShare) setMarketShare(data.marketShare);
      setMessage({ type: 'success', text: `다나와 데이터 수집 완료 (${data.totalSales?.toLocaleString()}대)` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '스크래핑 실패' });
    }
    setScraping(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const news: { company: string; headline: string; content: string; source: string; seq: number }[] = [];
      for (const [company, items] of Object.entries(newsData)) {
        items.forEach((item, i) => {
          news.push({ company, headline: item.headline, content: item.content, source: item.source, seq: i + 1 });
        });
      }
      const top = topModels.map((m) => ({
        rank: m.rank, model_name: m.model, company: m.maker, sales_qty: m.sales,
      }));
      const ms = Object.entries(marketShare).map(([company, share_pct]) => ({ company, share_pct }));

      const res = await fetch('/api/industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, news, topModels: top, marketShare: ms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `${year}년 ${month}월 업계동향 저장 완료!` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '저장 실패' });
    }
    setSaving(false);
  };

  const tabs = [...NEWS_COMPANIES, '판매현황/M/S'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">업계동향 입력</h1>
          <p className="text-sm text-stone-500 mt-1">뉴스 검색 및 시장 데이터</p>
        </div>
        <div className="flex items-center gap-3">
          <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50">
            {saving ? '저장 중...' : '전체 저장'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>{message.text}</div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => { setActiveTab(i); setSearchResults([]); }}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
              i === activeTab ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}>
            {tab}
            {i < NEWS_COMPANIES.length && (newsData[tab]?.length ?? 0) > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({newsData[tab]?.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* 뉴스 탭 */}
      {activeTab < NEWS_COMPANIES.length && (
        <div className="space-y-4">
          {/* 검색 */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex gap-2">
              <button onClick={() => handleSearch(NEWS_COMPANIES[activeTab])} disabled={searching}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50">
                {searching ? '검색 중...' : `${NEWS_COMPANIES[activeTab]} 뉴스 검색`}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchResults.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{item.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{item.description}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{item.source}</p>
                    </div>
                    <button onClick={() => addNews(NEWS_COMPANIES[activeTab], item)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 shrink-0">
                      추가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 뉴스 */}
          <div className="bg-white rounded-xl border border-stone-200">
            <div className="p-4 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800 text-sm">
                {NEWS_COMPANIES[activeTab]} 뉴스 ({newsData[NEWS_COMPANIES[activeTab]]?.length ?? 0}건)
              </h3>
            </div>
            {(newsData[NEWS_COMPANIES[activeTab]] ?? []).length === 0 ? (
              <p className="p-4 text-sm text-stone-400">뉴스를 검색하여 추가하세요</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {(newsData[NEWS_COMPANIES[activeTab]] ?? []).map((item, i) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <div className="flex-1">
                      <input value={item.headline}
                        onChange={(e) => {
                          const items = [...(newsData[NEWS_COMPANIES[activeTab]] ?? [])];
                          items[i] = { ...items[i], headline: e.target.value };
                          setNewsData({ ...newsData, [NEWS_COMPANIES[activeTab]]: items });
                        }}
                        className="w-full text-sm font-medium text-stone-800 border-b border-transparent
                                   hover:border-stone-300 focus:border-stone-500 focus:outline-none pb-0.5" />
                      <textarea value={item.content}
                        onChange={(e) => {
                          const items = [...(newsData[NEWS_COMPANIES[activeTab]] ?? [])];
                          items[i] = { ...items[i], content: e.target.value };
                          setNewsData({ ...newsData, [NEWS_COMPANIES[activeTab]]: items });
                        }}
                        rows={2}
                        className="w-full text-xs text-stone-600 mt-1 resize-y border border-stone-200
                                   rounded p-1.5 focus:outline-none focus:border-stone-400" />
                      <input value={item.source}
                        onChange={(e) => {
                          const items = [...(newsData[NEWS_COMPANIES[activeTab]] ?? [])];
                          items[i] = { ...items[i], source: e.target.value };
                          setNewsData({ ...newsData, [NEWS_COMPANIES[activeTab]]: items });
                        }}
                        className="w-full text-xs text-stone-400 mt-1 border-b border-transparent
                                   hover:border-stone-200 focus:border-stone-400 focus:outline-none" />
                    </div>
                    <button onClick={() => removeNews(NEWS_COMPANIES[activeTab], i)}
                      className="text-red-400 hover:text-red-600 text-xs shrink-0">삭제</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 판매현황 탭 */}
      {activeTab === NEWS_COMPANIES.length && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <button onClick={handleDanawa} disabled={scraping}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50">
              {scraping ? '수집 중...' : `다나와 ${year}년 ${month}월 데이터 수집`}
            </button>
          </div>

          {/* TOP10 */}
          {topModels.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-200">
                <h3 className="font-semibold text-stone-800 text-sm">판매 TOP 10</h3>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-stone-50">
                  <th className="text-center px-3 py-2 w-12">순위</th>
                  <th className="text-left px-3 py-2">모델명</th>
                  <th className="text-left px-3 py-2">제조사</th>
                  <th className="text-right px-3 py-2">판매량</th>
                </tr></thead>
                <tbody>
                  {topModels.map((m) => (
                    <tr key={m.rank} className="border-t border-stone-100">
                      <td className="text-center px-3 py-1.5 font-bold text-stone-400">{m.rank}</td>
                      <td className="px-3 py-1.5">{m.model}</td>
                      <td className="px-3 py-1.5 text-stone-500">{m.maker}</td>
                      <td className="text-right px-3 py-1.5 font-semibold tabular-nums">{formatKRW(m.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 시장점유율 */}
          {Object.keys(marketShare).length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-200">
                <h3 className="font-semibold text-stone-800 text-sm">시장점유율</h3>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-stone-50">
                  <th className="text-left px-4 py-2">제조사</th>
                  <th className="text-right px-4 py-2">점유율(%)</th>
                </tr></thead>
                <tbody>
                  {MARKET_COMPANIES.map((co) => (
                    <tr key={co} className="border-t border-stone-100">
                      <td className="px-4 py-1.5">{co}</td>
                      <td className="text-right px-4 py-1.5 font-semibold">
                        {(marketShare[co] ?? 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
