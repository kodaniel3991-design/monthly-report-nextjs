'use client';

import { useState, useRef } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';
import { formatKRW } from '@/lib/format';

type LaborParseResult = {
  sheetsUsed: string[];
  dbData: Record<string, number>;
};

export default function LaborPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<LaborParseResult | null>(null);
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
      const res = await fetch('/api/labor/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParsed(data);
      setStep(1);
      setMessage({ type: 'success', text: `시트 '${data.sheetsUsed.join("', '")}' 에서 데이터 추출 완료` });
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
      const res = await fetch('/api/labor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, data: parsed.dbData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `${year}년 ${month}월 인원·노무비 저장 완료!` });
      setStep(2);
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '저장 실패' });
    } finally {
      setSaving(false);
    }
  };

  const d = parsed?.dbData ?? {};
  const totalEmp = (d.mgmt_rkm ?? 0) + (d.prod_rkm ?? 0) + (d.mgmt_hkmc ?? 0) + (d.prod_hkmc ?? 0);
  const totalHours = (d.work_hours_rkm ?? 0) + (d.work_hours_hkmc ?? 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">인원·노무비 입력</h1>
          <p className="text-sm text-stone-500 mt-1">인원/근무시간/상여/퇴직급여 Excel 업로드</p>
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
            <p className="text-stone-500 mb-4">
              노무비 Excel 파일(.xlsx)을 업로드하세요<br />
              <span className="text-xs text-stone-400">인원/근무시간 시트 + 상여/퇴직 시트를 자동 인식합니다</span>
            </p>
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
        <div className="space-y-4">
          {/* 인원 */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800">상시종업원수 (명)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-4 py-2">구분</th>
                  <th className="text-right px-4 py-2 text-blue-700">RKM</th>
                  <th className="text-right px-4 py-2 text-emerald-700">HKMC</th>
                  <th className="text-right px-4 py-2 text-amber-700">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-4 py-1.5">관리직</td><td className="text-right px-4">{d.mgmt_rkm?.toFixed(1)}</td><td className="text-right px-4">{d.mgmt_hkmc?.toFixed(1)}</td><td className="text-right px-4 font-medium">{((d.mgmt_rkm ?? 0) + (d.mgmt_hkmc ?? 0)).toFixed(1)}</td></tr>
                <tr><td className="px-4 py-1.5">생산직</td><td className="text-right px-4">{d.prod_rkm?.toFixed(1)}</td><td className="text-right px-4">{d.prod_hkmc?.toFixed(1)}</td><td className="text-right px-4 font-medium">{((d.prod_rkm ?? 0) + (d.prod_hkmc ?? 0)).toFixed(1)}</td></tr>
                <tr className="bg-stone-50 font-semibold"><td className="px-4 py-1.5">합계</td><td className="text-right px-4">{((d.mgmt_rkm ?? 0) + (d.prod_rkm ?? 0)).toFixed(1)}</td><td className="text-right px-4">{((d.mgmt_hkmc ?? 0) + (d.prod_hkmc ?? 0)).toFixed(1)}</td><td className="text-right px-4">{totalEmp.toFixed(1)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 근무시간 */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800">근무시간 (h)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-4 py-2">구분</th>
                  <th className="text-right px-4 py-2 text-blue-700">RKM</th>
                  <th className="text-right px-4 py-2 text-emerald-700">HKMC</th>
                  <th className="text-right px-4 py-2 text-amber-700">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-4 py-1.5">실작업시간</td><td className="text-right px-4">{formatKRW(d.work_hours_rkm)}</td><td className="text-right px-4">{formatKRW(d.work_hours_hkmc)}</td><td className="text-right px-4 font-medium">{formatKRW(totalHours)}</td></tr>
                <tr><td className="px-4 py-1.5">잔업시간</td><td className="text-right px-4">{formatKRW(d.overtime_gimhae)} (김해)</td><td className="text-right px-4">{formatKRW(d.overtime_busan)} (부산)</td><td className="text-right px-4 font-medium">{formatKRW((d.overtime_gimhae ?? 0) + (d.overtime_busan ?? 0))}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 상여·퇴직 */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800">상여금·퇴직급여 (천원)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-4 py-2">구분</th>
                  <th className="text-right px-4 py-2 text-blue-700">RKM</th>
                  <th className="text-right px-4 py-2 text-emerald-700">HKMC</th>
                  <th className="text-right px-4 py-2 text-amber-700">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-4 py-1.5">상여금(생산직)</td><td className="text-right px-4">{formatKRW(d.bonus_prod_rkm)}</td><td className="text-right px-4">{formatKRW(d.bonus_prod_hkmc)}</td><td className="text-right px-4 font-medium">{formatKRW((d.bonus_prod_rkm ?? 0) + (d.bonus_prod_hkmc ?? 0))}</td></tr>
                <tr><td className="px-4 py-1.5">퇴직급여(사무직)</td><td className="text-right px-4">{formatKRW(d.retire_mgmt_rkm)}</td><td className="text-right px-4">{formatKRW(d.retire_mgmt_hkmc)}</td><td className="text-right px-4 font-medium">{formatKRW((d.retire_mgmt_rkm ?? 0) + (d.retire_mgmt_hkmc ?? 0))}</td></tr>
                <tr><td className="px-4 py-1.5">퇴직급여(생산직)</td><td className="text-right px-4">{formatKRW(d.retire_prod_rkm)}</td><td className="text-right px-4">{formatKRW(d.retire_prod_hkmc)}</td><td className="text-right px-4 font-medium">{formatKRW((d.retire_prod_rkm ?? 0) + (d.retire_prod_hkmc ?? 0))}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 버튼 */}
          <div className="flex justify-between">
            <button
              onClick={() => { setStep(0); setParsed(null); setMessage(null); }}
              className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50"
            >
              다시 업로드
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : `${year}년 ${month}월 저장`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 완료 */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">저장 완료</h2>
          <p className="text-sm text-stone-500 mb-6">
            {year}년 {month}월 인원·노무비가 DB에 저장되었습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep(0); setParsed(null); setMessage(null); }}
              className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50"
            >
              다른 월 입력
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              대시보드 확인 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
