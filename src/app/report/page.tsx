'use client';

import { useState } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';

export default function ReportPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownload = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${year}_${String(month).padStart(2, '0')}_월차보고.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: '보고서 다운로드 완료!' });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '생성 실패' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">보고서 다운로드</h1>
          <p className="text-sm text-stone-500 mt-1">Excel 보고서 생성 및 다운로드</p>
        </div>
        <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>{message.text}</div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            {year}년 {month}월 월차보고서
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            손익실적 + 노동생산성 + 업계동향을 포함한 Excel 보고서를 생성합니다
          </p>

          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-stone-400 space-y-1">
              <p>Sheet 1: 손익실적 (공장별 + 사업부별)</p>
              <p>Sheet 2: 노동생산성 (6대 지표)</p>
              <p>Sheet 3: 업계동향 (뉴스 + TOP10 + 시장점유율)</p>
            </div>

            <button
              onClick={handleDownload}
              disabled={generating}
              className="mt-4 px-8 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700
                         disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {generating ? '생성 중...' : 'Excel 다운로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
