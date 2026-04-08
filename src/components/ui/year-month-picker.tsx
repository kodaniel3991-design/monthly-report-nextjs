'use client';

interface YearMonthPickerProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export default function YearMonthPicker({
  year,
  month,
  onYearChange,
  onMonthChange,
}: YearMonthPickerProps) {
  const years = Array.from({ length: 5 }, (_, i) => 2024 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-3">
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-stone-400"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-stone-400"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>
    </div>
  );
}
