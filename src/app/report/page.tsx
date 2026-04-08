'use client';

import { useState } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';

type DownloadItem = {
  label: string;
  description: string;
  endpoint: string;
  body: Record<string, unknown>;
  filename: string;
};

export default function ReportPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const downloads: DownloadItem[] = [
    {
      label: '노동생산성 (템플릿)',
      description: '기존 노동생산성 Excel 템플릿에 데이터를 채워 출력합니다',
      endpoint: '/api/report/template',
      body: { year, month, type: 'labor' },
      filename: `노동생산성_${year}_${String(month).padStart(2, '0')}.xlsx`,
    },
    {
      label: '업계동향 (템플릿)',
      description: '기존 업계동향 Excel 템플릿에 뉴스/TOP10/시장점유율을 채워 출력합니다',
      endpoint: '/api/report/template',
      body: { year, month, type: 'industry' },
      filename: `업계동향_${year}_${String(month).padStart(2, '0')}.xlsx`,
    },
    {
      label: '월차보고서 (통합)',
      description: '손익실적 + 노동생산성 + 업계동향을 포함한 통합 보고서',
      endpoint: '/api/report',
      body: { year, month },
      filename: `${year}_${String(month).padStart(2, '0')}_월차보고.xlsx`,
    },
  ];

  const handleDownload = async (item: DownloadItem) => {
    setDownloading(item.label);
    setMessage(null);
    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `${item.label} 다운로드 완료!` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '생성 실패' });
    } finally {
      setDownloading(null);
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

      <div className="grid gap-4">
        {downloads.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-stone-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-800">{item.label}</h3>
              <p className="text-sm text-stone-500 mt-1">{item.description}</p>
            </div>
            <button
              onClick={() => handleDownload(item)}
              disabled={downloading !== null}
              className="px-5 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700
                         disabled:opacity-50 transition-colors text-sm font-medium shrink-0 ml-4"
            >
              {downloading === item.label ? '생성 중...' : '다운로드'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
