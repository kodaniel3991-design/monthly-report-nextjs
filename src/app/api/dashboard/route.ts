import { NextRequest, NextResponse } from 'next/server';
import { loadMonthlyPL, loadMonthlyLabor } from '@/lib/supabase/queries';
import {
  buildFactoryPLFromDB, buildLaborInputFromDB,
  sumFactories, sales, laborCost, calcValueAdded,
  calcLaborProductivityTotal, calcLaborProductivityByDivision,
  contributionMargin, operatingProfit, fixedCost, variableCost,
  totalEmployees, prodEmployees, totalWorkHours,
  rkmEmployees, hkmcEmployees, retireTotal,
} from '@/lib/calculator';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  if (!year || !month) {
    return NextResponse.json({ error: 'year, month 필수' }, { status: 400 });
  }

  try {
    const [plData, laborData] = await Promise.all([
      loadMonthlyPL(year, month),
      loadMonthlyLabor(year, month),
    ]);

    if (!plData || Object.keys(plData).length === 0) {
      return NextResponse.json({ error: '손익실적 데이터 없음' }, { status: 404 });
    }

    // 공장별 PL 생성
    const gimhae = buildFactoryPLFromDB(plData, 'gimhae');
    const busan = buildFactoryPLFromDB(plData, 'busan');
    const ulsan = buildFactoryPLFromDB(plData, 'ulsan');
    const gimhae2 = buildFactoryPLFromDB(plData, 'gimhae2');

    // 사업부별 합산
    const rkm = sumFactories('RKM', gimhae, busan);
    const hkmc = sumFactories('HKMC', ulsan, gimhae2);
    const total = sumFactories('계', gimhae, busan, ulsan, gimhae2);

    // 노동 데이터
    const labor = buildLaborInputFromDB(laborData);
    const totalLaborCost = laborCost(total);
    const totalRetire = retireTotal(labor);

    // 노동생산성
    const lpTotal = calcLaborProductivityTotal(total, labor, totalLaborCost, totalRetire);
    const [lpRkm, lpHkmc] = calcLaborProductivityByDivision(rkm, hkmc, labor, totalLaborCost);

    return NextResponse.json({
      // 손익 요약
      summary: {
        sales: sales(total),
        contributionMargin: contributionMargin(total),
        operatingProfit: operatingProfit(total),
        valueAdded: calcValueAdded(total),
        variableCost: variableCost(total),
        fixedCost: fixedCost(total),
      },
      // 사업부별
      divisions: {
        rkm: {
          sales: sales(rkm),
          valueAdded: calcValueAdded(rkm),
          operatingProfit: operatingProfit(rkm),
        },
        hkmc: {
          sales: sales(hkmc),
          valueAdded: calcValueAdded(hkmc),
          operatingProfit: operatingProfit(hkmc),
        },
      },
      // 인원
      headcount: {
        total: totalEmployees(labor),
        prod: prodEmployees(labor),
        rkm: rkmEmployees(labor),
        hkmc: hkmcEmployees(labor),
        workHours: totalWorkHours(labor),
      },
      // 노동생산성 지표
      productivity: { total: lpTotal, rkm: lpRkm, hkmc: lpHkmc },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
