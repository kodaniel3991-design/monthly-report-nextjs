'use client';

import { useState, useRef } from 'react';
import { formatKRW } from '@/lib/format';

type PlanParseResult = {
  sheetName: string;
  months: Record<number, Record<string, number>>;
};

const PREVIEW_KEYS = [
  { key: 'gimhae', label: '김해' },
  { key: 'busan', label: '부산' },
  { key: 'rkm', label: 'RKM' },
  { key: 'ulsan', label: '울산' },
  { key: 'gimhae2', label: '김해2' },
  { key: 'hkmc', label: 'HKMC' },
  { key: 'total', label: '합계' },
];

const PLAN_ITEMS = [
  { code: 'qty', label: '판매수량(대)', bold: false },
  { code: 'prod', label: '생산금액', bold: false },
  { code: 'sales', label: '매출액', bold: true },
  { code: 'sales_prod', label: '  제품매출', bold: false },
  { code: 'sales_out', label: '  상품매출', bold: false },
  { code: 'variable_cost', label: '변동비', bold: true },
  { code: 'material', label: '  재료비', bold: false },
  { code: 'mfg_expense', label: '  제조경비(변동)', bold: false },
  { code: 'selling_trans', label: '  판매운반비', bold: false },
  { code: 'merch_purchase', label: '  상품매입', bold: false },
  { code: 'contribution', label: '한계이익', bold: true },
  { code: 'fixed_cost', label: '고정비', bold: true },
  { code: 'labor_cost', label: '  노무비', bold: false },
  { code: 'staff_cost', label: '  인건비', bold: false },
  { code: 'fix_mfg', label: '  제조경비(고정)', bold: false },
  { code: 'operating_profit', label: '영업이익', bold: true },
  { code: 'ordinary_profit', label: '경상이익', bold: true },
];

export default function PlanPage() {
  const [year, setYear] = useState(2026);
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<PlanParseResult | null>(null);
  const [viewMonth, setViewMonth] = useState(1);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/plan/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParsed(data);
      setStep(1);
      setMessage({ type: 'success', text: `시트 '${data.sheetName}'에서 12개월 사업계획 추출 완료` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '파싱 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    setMessage(null);
    try {
      // 12개월 순차 저장
      for (let month = 1; month <= 12; month++) {
        const monthData = parsed.months[month];
        if (!monthData) continue;

        // total 기준으로 item 저장
        const items = PLAN_ITEMS.map((item) => ({
          item_code: item.code,
          item_name: item.label.trim(),
          value: monthData[`${item.code}_total`] ?? 0,
        }));

        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year, month, items }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      setMessage({ type: 'success', text: `${year}년 사업계획 12개월 저장 완료!` });
      setStep(2);
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '저장 실패' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">사업계획 입력</h1>
          <p className="text-sm text-stone-500 mt-1">연간 사업계획 Excel 업로드 (12개월 일괄)</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm">
          {[2024, 2025, 2026, 2027, 2028].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>

      {/* 스텝 */}
      <div className="flex gap-2 mb-4">
        {['업로드', '미리보기', '완료'].map((label, i) => (
          <span key={label}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              i === step ? 'bg-stone-800 text-white'
                : i < step ? 'bg-green-100 text-green-700'
                  : 'bg-stone-100 text-stone-400'
            }`}>
            {i < step ? '✓ ' : ''}{label}
          </span>
        ))}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>{message.text}</div>
      )}

      {/* STEP 0: 업로드 */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <p className="text-stone-500 mb-4">사업계획 Excel 파일(.xlsx)을 업로드하세요</p>
          <p className="text-xs text-stone-400 mb-4">12개월 × 7구분(공장4+사업부2+합계) × 21항목을 자동 추출합니다</p>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            className="px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50">
            {loading ? '파싱 중...' : '파일 선택'}
          </button>
        </div>
      )}

      {/* STEP 1: 미리보기 */}
      {step === 1 && parsed && (
        <div className="space-y-4">
          {/* 뷰 모드 전환 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-sm rounded-lg ${viewMode === 'monthly' ? 'bg-stone-800 text-white' : 'bg-white border border-stone-300'}`}>
                월별 상세
              </button>
              <button onClick={() => setViewMode('annual')}
                className={`px-3 py-1.5 text-sm rounded-lg ${viewMode === 'annual' ? 'bg-stone-800 text-white' : 'bg-white border border-stone-300'}`}>
                연간 추이
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setStep(0); setParsed(null); setMessage(null); }}
                className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50">
                다시 업로드
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50">
                {saving ? '저장 중...' : `${year}년 전체 저장`}
              </button>
            </div>
          </div>

          {/* 월별 상세 */}
          {viewMode === 'monthly' && (
            <>
              <div className="flex gap-1 overflow-x-auto">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <button key={m} onClick={() => setViewMonth(m)}
                    className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
                      m === viewMonth ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 hover:bg-stone-50'
                    }`}>
                    {m}월
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="text-left px-3 py-2 font-medium text-stone-600 sticky left-0 bg-stone-50 min-w-[140px]">항목</th>
                      {PREVIEW_KEYS.map(({ key, label }) => (
                        <th key={key} className={`text-right px-3 py-2 font-medium min-w-[90px] ${
                          key === 'rkm' ? 'text-blue-700 bg-blue-50/50'
                            : key === 'hkmc' ? 'text-emerald-700 bg-emerald-50/50'
                              : key === 'total' ? 'text-amber-700 bg-amber-50/50' : 'text-stone-600'
                        }`}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_ITEMS.map((item) => {
                      const monthData = parsed.months[viewMonth] ?? {};
                      return (
                        <tr key={item.code} className={item.bold ? 'bg-stone-50 font-semibold' : 'hover:bg-stone-50/50'}>
                          <td className={`px-3 py-1.5 sticky left-0 ${item.bold ? 'bg-stone-50' : 'bg-white'}`}>{item.label}</td>
                          {PREVIEW_KEYS.map(({ key }) => (
                            <td key={key} className={`text-right px-3 py-1.5 tabular-nums ${
                              key === 'rkm' ? 'bg-blue-50/30' : key === 'hkmc' ? 'bg-emerald-50/30'
                                : key === 'total' ? 'bg-amber-50/30' : ''
                            }`}>
                              {formatKRW(monthData[`${item.code}_${key}`])}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 연간 추이 (합계 기준) */}
          {viewMode === 'annual' && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="text-left px-3 py-2 font-medium text-stone-600 sticky left-0 bg-stone-50 min-w-[140px]">항목</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="text-right px-3 py-2 font-medium text-stone-600 min-w-[80px]">{i + 1}월</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_ITEMS.filter((item) => item.bold).map((item) => (
                    <tr key={item.code} className="border-t border-stone-100">
                      <td className="px-3 py-1.5 font-semibold sticky left-0 bg-white">{item.label}</td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthData = parsed.months[i + 1] ?? {};
                        return (
                          <td key={i} className="text-right px-3 py-1.5 tabular-nums">
                            {formatKRW(monthData[`${item.code}_total`])}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: 완료 */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">저장 완료</h2>
          <p className="text-sm text-stone-500 mb-6">{year}년 사업계획 12개월이 DB에 저장되었습니다.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep(0); setParsed(null); setMessage(null); }}
              className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50">
              다시 입력
            </button>
            <a href="/industry"
              className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700">
              업계동향 입력 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
