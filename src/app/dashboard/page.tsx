'use client';

import { useState, useEffect } from 'react';
import YearMonthPicker from '@/components/ui/year-month-picker';
import MetricCard from '@/components/ui/metric-card';
import { formatKRW, formatPct, formatDecimal } from '@/lib/format';

type DashboardData = {
  summary: {
    sales: number;
    contributionMargin: number;
    operatingProfit: number;
    valueAdded: number;
    variableCost: number;
    fixedCost: number;
  };
  divisions: {
    rkm: { sales: number; valueAdded: number; operatingProfit: number };
    hkmc: { sales: number; valueAdded: number; operatingProfit: number };
  };
  headcount: {
    total: number;
    prod: number;
    rkm: number;
    hkmc: number;
    workHours: number;
  };
  productivity: {
    total: { valueAddedRatio: number; laborProductivity: number; laborIncomeRatio: number; hourlyWage: number; wagePerPerson: number; laborCostToSales: number };
    rkm: { valueAddedRatio: number; laborProductivity: number; laborIncomeRatio: number; hourlyWage: number; wagePerPerson: number; laborCostToSales: number };
    hkmc: { valueAddedRatio: number; laborProductivity: number; laborIncomeRatio: number; hourlyWage: number; wagePerPerson: number; laborCostToSales: number };
  };
};

export default function DashboardPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard?year=${year}&month=${month}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '데이터 로드 실패');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">대시보드</h1>
          <p className="text-sm text-stone-500 mt-1">노동생산성 지표 자동 계산</p>
        </div>
        <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-400">
          로딩 중...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* 손익 요약 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-3">손익 요약</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="매출액" value={formatKRW(data.summary.sales)} unit="천원" />
              <MetricCard label="한계이익" value={formatKRW(data.summary.contributionMargin)} unit="천원" />
              <MetricCard label="영업이익" value={formatKRW(data.summary.operatingProfit)} unit="천원" />
              <MetricCard label="부가가치" value={formatKRW(data.summary.valueAdded)} unit="천원" />
            </div>
          </div>

          {/* 사업부별 비교 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-3">사업부별 비교</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* RKM */}
              <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-5">
                <h3 className="text-sm font-bold text-blue-800 mb-3">RKM (김해+부산)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-blue-600">매출액</span><span className="font-semibold">{formatKRW(data.divisions.rkm.sales)}</span></div>
                  <div className="flex justify-between"><span className="text-blue-600">부가가치</span><span className="font-semibold">{formatKRW(data.divisions.rkm.valueAdded)}</span></div>
                  <div className="flex justify-between"><span className="text-blue-600">영업이익</span><span className="font-semibold">{formatKRW(data.divisions.rkm.operatingProfit)}</span></div>
                  <div className="flex justify-between"><span className="text-blue-600">부가가치율</span><span className="font-semibold">{formatPct(data.productivity.rkm.valueAddedRatio * 100)}</span></div>
                </div>
              </div>
              {/* HKMC */}
              <div className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-5">
                <h3 className="text-sm font-bold text-emerald-800 mb-3">HKMC (울산+김해2)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-emerald-600">매출액</span><span className="font-semibold">{formatKRW(data.divisions.hkmc.sales)}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-600">부가가치</span><span className="font-semibold">{formatKRW(data.divisions.hkmc.valueAdded)}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-600">영업이익</span><span className="font-semibold">{formatKRW(data.divisions.hkmc.operatingProfit)}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-600">부가가치율</span><span className="font-semibold">{formatPct(data.productivity.hkmc.valueAddedRatio * 100)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 노동생산성 6대 지표 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-3">노동생산성 6대 지표</h2>
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="text-left px-4 py-2.5 font-medium text-stone-600">지표</th>
                    <th className="text-right px-4 py-2.5 font-medium text-stone-600">산식</th>
                    <th className="text-right px-4 py-2.5 font-medium text-blue-700">RKM</th>
                    <th className="text-right px-4 py-2.5 font-medium text-emerald-700">HKMC</th>
                    <th className="text-right px-4 py-2.5 font-medium text-amber-700">전체</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-stone-100">
                    <td className="px-4 py-2">부가가치율</td>
                    <td className="text-right px-4 text-stone-400 text-xs">부가가치 / 매출액</td>
                    <td className="text-right px-4 font-semibold">{formatPct(data.productivity.rkm.valueAddedRatio * 100)}</td>
                    <td className="text-right px-4 font-semibold">{formatPct(data.productivity.hkmc.valueAddedRatio * 100)}</td>
                    <td className="text-right px-4 font-bold">{formatPct(data.productivity.total.valueAddedRatio * 100)}</td>
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="px-4 py-2">노동생산성</td>
                    <td className="text-right px-4 text-stone-400 text-xs">부가가치 / 종업원수</td>
                    <td className="text-right px-4 font-semibold">{formatKRW(data.productivity.rkm.laborProductivity)}</td>
                    <td className="text-right px-4 font-semibold">{formatKRW(data.productivity.hkmc.laborProductivity)}</td>
                    <td className="text-right px-4 font-bold">{formatKRW(data.productivity.total.laborProductivity)}</td>
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="px-4 py-2">근로소득배분율</td>
                    <td className="text-right px-4 text-stone-400 text-xs">노무비 / 부가가치</td>
                    <td className="text-right px-4 font-semibold">{formatPct(data.productivity.rkm.laborIncomeRatio * 100)}</td>
                    <td className="text-right px-4 font-semibold">{formatPct(data.productivity.hkmc.laborIncomeRatio * 100)}</td>
                    <td className="text-right px-4 font-bold">{formatPct(data.productivity.total.laborIncomeRatio * 100)}</td>
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="px-4 py-2">인건비율</td>
                    <td className="text-right px-4 text-stone-400 text-xs">노무비 / 매출액</td>
                    <td className="text-right px-4 font-semibold">{formatPct(data.productivity.rkm.laborCostToSales * 100)}</td>
                    <td className="text-right px-4 font-semibold">{formatPct(data.productivity.hkmc.laborCostToSales * 100)}</td>
                    <td className="text-right px-4 font-bold">{formatPct(data.productivity.total.laborCostToSales * 100)}</td>
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="px-4 py-2">1인당 임금수준</td>
                    <td className="text-right px-4 text-stone-400 text-xs">노무비 / 종업원수</td>
                    <td className="text-right px-4 font-semibold">{formatKRW(data.productivity.rkm.wagePerPerson)}</td>
                    <td className="text-right px-4 font-semibold">{formatKRW(data.productivity.hkmc.wagePerPerson)}</td>
                    <td className="text-right px-4 font-bold">{formatKRW(data.productivity.total.wagePerPerson)}</td>
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="px-4 py-2">시간당 임금</td>
                    <td className="text-right px-4 text-stone-400 text-xs">노무비 / 실작업시간</td>
                    <td className="text-right px-4 font-semibold">{formatDecimal(data.productivity.rkm.hourlyWage)}</td>
                    <td className="text-right px-4 font-semibold">{formatDecimal(data.productivity.hkmc.hourlyWage)}</td>
                    <td className="text-right px-4 font-bold">{formatDecimal(data.productivity.total.hourlyWage)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 인원 현황 */}
          <div>
            <h2 className="text-sm font-semibold text-stone-500 mb-3">인원 현황</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="전체 종업원" value={formatDecimal(data.headcount.total)} unit="명" />
              <MetricCard label="생산직" value={formatDecimal(data.headcount.prod)} unit="명" />
              <MetricCard label="RKM 인원" value={formatDecimal(data.headcount.rkm)} unit="명" />
              <MetricCard label="HKMC 인원" value={formatDecimal(data.headcount.hkmc)} unit="명" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
