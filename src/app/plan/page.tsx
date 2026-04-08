'use client';

import { useState } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';

export default function PlanPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">사업계획 입력</h1>
          <p className="text-sm text-stone-500 mt-1">연간 사업계획 Excel 업로드</p>
        </div>
        <YearMonthPicker
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400">
        <p>사업계획 입력 페이지 (구현 예정)</p>
      </div>
    </div>
  );
}
