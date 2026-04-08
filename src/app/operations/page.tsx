'use client';

import { useState, useEffect } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';
import { OPERATION_SECTIONS } from '@/lib/constants';

export default function OperationsPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/operations?year=${year}&month=${month}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const map: Record<string, string> = {};
          for (const row of data) {
            map[row.section] = row.content ?? '';
          }
          setSections(map);
        } else {
          setSections({});
        }
      } catch {
        setSections({});
      }
    };
    load();
  }, [year, month]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = OPERATION_SECTIONS.map((s) => ({
        section: s.code,
        section_name: s.name,
        content: sections[s.code] ?? '',
      }));
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, sections: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `${year}년 ${month}월 운영실적 저장 완료!` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '저장 실패' });
    } finally {
      setSaving(false);
    }
  };

  const filledCount = OPERATION_SECTIONS.filter((s) => (sections[s.code] ?? '').trim().length > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">운영실적 입력</h1>
          <p className="text-sm text-stone-500 mt-1">
            7개 섹션 서술형 보고 ({filledCount}/{OPERATION_SECTIONS.length} 작성)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {OPERATION_SECTIONS.map((s) => (
          <div key={s.code} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800 text-sm">{s.name}</h3>
              {(sections[s.code] ?? '').trim().length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">작성됨</span>
              )}
            </div>
            <textarea
              value={sections[s.code] ?? ''}
              onChange={(e) => setSections({ ...sections, [s.code]: e.target.value })}
              placeholder={`${s.name} 내용을 입력하세요...`}
              rows={5}
              className="w-full px-4 py-3 text-sm text-stone-700 resize-y focus:outline-none
                         placeholder:text-stone-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
