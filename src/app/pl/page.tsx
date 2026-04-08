'use client';

import { useState, useRef } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';
import { formatKRW } from '@/lib/format';

type PLParseResult = {
  sheetName: string;
  dbData: Record<string, number>;
  preview: Record<string, { label: string; values: Record<string, number> }>;
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

const PREVIEW_ROWS = [
  '_sales', 'sales_prod', 'sales_out',
  '_variable_cost', 'inv_diff', 'material',
  '_mfg_var_sub', 'mfg_welfare', 'mfg_power', 'mfg_trans',
  'mfg_repair', 'mfg_supplies', 'mfg_fee', 'mfg_other',
  'selling_trans', 'merch_purchase',
  '_margin', '_fixed_cost',
  '_labor_sub', 'labor_salary', 'labor_wage', 'labor_bonus', 'labor_retire', 'labor_outsrc',
  '_staff_sub', 'staff_salary', 'staff_bonus', 'staff_retire',
  '_fix_mfg_sub', 'fix_depr', 'fix_lease', 'fix_outsrc', 'fix_other',
  '_op_profit',
  'non_op_income', 'non_op_expense',
  '_ordinary',
];

export default function PLPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<PLParseResult | null>(null);
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
      const res = await fetch('/api/pl/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParsed(data);
      setStep(1);
      setMessage({ type: 'success', text: `시트 '${data.sheetName}'에서 데이터 추출 완료` });
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
      const res = await fetch('/api/pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, data: parsed.dbData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `${year}년 ${month}월 손익실적 저장 완료!` });
      setStep(2);
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '저장 실패' });
    } finally {
      setSaving(false);
    }
  };

  const isCalcRow = (field: string) => field.startsWith('_');

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">손익실적 입력</h1>
          <p className="text-sm text-stone-500 mt-1">Excel 업로드 → 미리보기 → 저장</p>
        </div>
        <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {/* 스텝 표시 */}
      <div className="flex gap-2 mb-4">
        {['업로드', '미리보기', '완료'].map((label, i) => (
          <span
            key={label}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              i === step
                ? 'bg-stone-800 text-white'
                : i < step
                  ? 'bg-green-100 text-green-700'
                  : 'bg-stone-100 text-stone-400'
            }`}
          >
            {i < step ? '✓ ' : ''}{label}
          </span>
        ))}
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* STEP 0: 업로드 */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <div className="text-center">
            <p className="text-stone-500 mb-4">손익실적 Excel 파일(.xlsx)을 업로드하세요</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700
                         disabled:opacity-50 transition-colors"
            >
              {loading ? '파싱 중...' : '파일 선택'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: 미리보기 */}
      {step === 1 && parsed && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <span className="text-sm text-stone-500">시트: {parsed.sheetName} | 단위: 천원</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setStep(0); setParsed(null); setMessage(null); }}
                className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                다시 업로드
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700
                           disabled:opacity-50"
              >
                {saving ? '저장 중...' : `${year}년 ${month}월 저장`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-3 py-2 font-medium text-stone-600 sticky left-0 bg-stone-50 min-w-[160px]">항목</th>
                  {PREVIEW_KEYS.map(({ key, label }) => (
                    <th
                      key={key}
                      className={`text-right px-3 py-2 font-medium min-w-[100px] ${
                        key === 'rkm' ? 'text-blue-700 bg-blue-50/50'
                          : key === 'hkmc' ? 'text-emerald-700 bg-emerald-50/50'
                            : key === 'total' ? 'text-amber-700 bg-amber-50/50'
                              : 'text-stone-600'
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROWS.map((field) => {
                  const item = parsed.preview[field];
                  if (!item) return null;
                  const isCalc = isCalcRow(field);
                  return (
                    <tr key={field} className={isCalc ? 'bg-stone-50 font-semibold' : 'hover:bg-stone-50/50'}>
                      <td className={`px-3 py-1.5 sticky left-0 ${isCalc ? 'bg-stone-50 text-stone-800' : 'bg-white text-stone-600'}`}>
                        {item.label}
                      </td>
                      {PREVIEW_KEYS.map(({ key }) => (
                        <td
                          key={key}
                          className={`text-right px-3 py-1.5 tabular-nums ${
                            key === 'rkm' ? 'bg-blue-50/30'
                              : key === 'hkmc' ? 'bg-emerald-50/30'
                                : key === 'total' ? 'bg-amber-50/30'
                                  : ''
                          }`}
                        >
                          {formatKRW(item.values[key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 2: 완료 */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">저장 완료</h2>
          <p className="text-sm text-stone-500 mb-6">
            {year}년 {month}월 손익실적이 DB에 저장되었습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep(0); setParsed(null); setMessage(null); }}
              className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50"
            >
              다른 월 입력
            </button>
            <a
              href="/labor"
              className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              인원·노무비 입력 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
