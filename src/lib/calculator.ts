// ============================================================
// 진양오토모티브 월차보고 시스템 — 계산 엔진
// Python calculator.py → TypeScript 포팅
// 모든 수식은 기존 Excel 파일에서 역공학으로 추출
// 단위: 천원(KRW), 명, 시간, 대(판매수량)
// ============================================================

import type { FactoryPL, LaborInput, LaborProductivity } from './types';

// ── 안전한 숫자 변환 ─────────────────────────────────────────

function n(v: number | null | undefined): number {
  return v ?? 0;
}

// ── FactoryPL 계산 속성 ──────────────────────────────────────

/** 매출액 = 생산품 + 외주품 */
export function sales(pl: FactoryPL): number {
  return pl.salesProd + pl.salesOut;
}

/** 변동 제조경비 합계 */
export function mfgExpense(pl: FactoryPL): number {
  return (
    pl.mfgWelfare + pl.mfgPower + pl.mfgTrans +
    pl.mfgRepair + pl.mfgSupplies + pl.mfgFee + pl.mfgOther
  );
}

/** 변동비 = 재고증감차 + 재료비 + 제조경비 + 판매운반비 + 상품매입 */
export function variableCost(pl: FactoryPL): number {
  return (
    pl.invDiff + pl.material + mfgExpense(pl) +
    pl.sellingTrans + pl.merchPurchase
  );
}

/** 노무비 합계 */
export function laborCost(pl: FactoryPL): number {
  return (
    pl.laborSalary + pl.laborWage + pl.laborBonus +
    pl.laborRetire + pl.laborOutsrc
  );
}

/** 인건비 합계 */
export function staffCost(pl: FactoryPL): number {
  return pl.staffSalary + pl.staffBonus + pl.staffRetire;
}

/** 고정 제조경비 */
export function fixMfgExpense(pl: FactoryPL): number {
  return pl.fixDepr + pl.fixLease + pl.fixOutsrc + pl.fixOther;
}

/** 고정비 = 노무비 + 인건비 + 제조경비 */
export function fixedCost(pl: FactoryPL): number {
  return laborCost(pl) + staffCost(pl) + fixMfgExpense(pl);
}

/** 한계이익 = 매출액 - 변동비 */
export function contributionMargin(pl: FactoryPL): number {
  return sales(pl) - variableCost(pl);
}

/** 영업이익 = 한계이익 - 고정비 */
export function operatingProfit(pl: FactoryPL): number {
  return contributionMargin(pl) - fixedCost(pl);
}

/** 경상이익 = 영업이익 + 영업외수익 - 영업외비용 */
export function ordinaryProfit(pl: FactoryPL): number {
  return operatingProfit(pl) + pl.nonOpIncome - pl.nonOpExpense;
}

/** 매출액 대비 비율 (%) */
export function pct(pl: FactoryPL, value: number): number {
  const s = sales(pl);
  return s ? Math.round((value / s) * 10000) / 100 : 0;
}

// ── 공장 합산 ────────────────────────────────────────────────

const FIELDS_TO_SUM: (keyof FactoryPL)[] = [
  'qty', 'prodAmount',
  'salesProd', 'salesOut', 'invDiff',
  'material', 'mfgWelfare', 'mfgPower', 'mfgTrans', 'mfgRepair',
  'mfgSupplies', 'mfgFee', 'mfgOther',
  'sellingTrans', 'merchPurchase',
  'laborSalary', 'laborWage', 'laborBonus', 'laborRetire', 'laborOutsrc',
  'staffSalary', 'staffBonus', 'staffRetire',
  'fixDepr', 'fixLease', 'fixOutsrc', 'fixOther',
  'nonOpIncome', 'nonOpExpense', 'interestIncome', 'interestExpense',
];

/** 여러 공장 합산 */
export function sumFactories(name: string, ...factories: FactoryPL[]): FactoryPL {
  const result: FactoryPL = {
    name,
    qty: 0, prodAmount: 0,
    salesProd: 0, salesOut: 0,
    invDiff: 0, material: 0,
    mfgWelfare: 0, mfgPower: 0, mfgTrans: 0, mfgRepair: 0,
    mfgSupplies: 0, mfgFee: 0, mfgOther: 0,
    mfgWater: 0, mfgInsurance: 0,
    sellingTrans: 0, merchPurchase: 0,
    laborSalary: 0, laborWage: 0, laborBonus: 0, laborRetire: 0, laborOutsrc: 0,
    staffSalary: 0, staffBonus: 0, staffRetire: 0,
    fixDepr: 0, fixLease: 0, fixOutsrc: 0, fixOther: 0,
    nonOpIncome: 0, nonOpExpense: 0, interestIncome: 0, interestExpense: 0,
  };

  for (const f of factories) {
    for (const key of FIELDS_TO_SUM) {
      (result as unknown as Record<string, number>)[key] += (f as unknown as Record<string, number>)[key] ?? 0;
    }
  }
  return result;
}

// ── LaborInput 계산 속성 ─────────────────────────────────────

export function totalEmployees(l: LaborInput): number {
  return l.mgmtRkm + l.mgmtHkmc + l.prodRkm + l.prodHkmc;
}

export function prodEmployees(l: LaborInput): number {
  return l.prodRkm + l.prodHkmc;
}

export function rkmEmployees(l: LaborInput): number {
  return l.mgmtRkm + l.prodRkm;
}

export function hkmcEmployees(l: LaborInput): number {
  return l.mgmtHkmc + l.prodHkmc;
}

export function totalWorkHours(l: LaborInput): number {
  return l.workHoursRkm + l.workHoursHkmc;
}

/** 근무시간 기준 RKM 비율 */
export function rkmRatio(l: LaborInput): number {
  const total = totalWorkHours(l);
  return total ? l.workHoursRkm / total : 0;
}

export function hkmcRatio(l: LaborInput): number {
  return 1 - rkmRatio(l);
}

export function retireProdTotal(l: LaborInput): number {
  return l.retireProdRkm + l.retireProdHkmc;
}

export function retireTotal(l: LaborInput): number {
  return l.retireMgmtRkm + l.retireMgmtHkmc + l.retireProdRkm + l.retireProdHkmc;
}

// ── 노동생산성 지표 계산 ─────────────────────────────────────

export function calcLaborMetrics(lp: LaborProductivity) {
  const s = lp.sales;
  const va = lp.valueAdded;
  const lc = lp.laborCost;
  const rc = lp.retireCost;
  const emp = lp.employees;
  const pe = lp.prodEmployees;
  const wh = lp.workHours;
  const rp = lp.retireProd;

  return {
    /** 부가가치율 = 부가가치 / 매출액 */
    valueAddedRatio: s ? va / s : 0,
    /** 노동생산성 = 부가가치 / 종업원수 (천원/인) */
    laborProductivity: emp ? va / emp : 0,
    /** 근로소득배분율 = 노무비 / 부가가치 */
    laborIncomeRatio: va ? lc / va : 0,
    /** 퇴직복리 배분율 */
    retireRatio: va ? rc / va : 0,
    /** 인건비 배분율 = (노무비+퇴직복리) / 부가가치 */
    totalPersonnelRatio: va ? (lc + rc) / va : 0,
    /** 매출대비 노무비율 */
    laborCostToSales: s ? lc / s : 0,
    /** 1인당 임금수준 (천원/인/월) */
    wagePerPerson: emp ? lc / emp : 0,
    /** 1인당 퇴직금 (생산직 기준) */
    retirePerPerson: pe ? rp / pe : 0,
    /** 시간당 임금 (천원/시간) */
    hourlyWage: wh ? lc / wh : 0,
    /** 1인당 생산금액 */
    prodPerPerson: pe ? lp.prodAmount / pe : 0,
    /** 1원당 생산금액 */
    prodPerWon: (lc + rp) ? lp.prodAmount / (lc + rp) : 0,
  };
}

// ── 핵심 계산 함수 ───────────────────────────────────────────

/**
 * 附加價値 = 賣出額 - 変動費 + 変動 複利厚生費
 * = 한계이익 + 복리후생비(변동)
 *
 * 검증 (2026년 3월):
 *   전체: 4,848,177 - 3,703,139 + 11,210 = 1,156,248 ✓
 *   RKM:  3,503,150 - 2,608,461 + 9,905  = 904,594   ✓
 *   HKMC: 1,345,027 - 1,094,678 + 1,305  = 251,654   ✓
 */
export function calcValueAdded(pl: FactoryPL): number {
  return contributionMargin(pl) + pl.mfgWelfare;
}

/** 총괄 노동생산성 계산 */
export function calcLaborProductivityTotal(
  plTotal: FactoryPL,
  labor: LaborInput,
  laborCostTotal: number,
  retireTotalVal: number,
): LaborProductivity {
  const va = calcValueAdded(plTotal);
  return {
    sales: sales(plTotal),
    valueAdded: va,
    laborCost: laborCostTotal,
    retireCost: retireTotalVal,
    prodAmount: plTotal.prodAmount,
    employees: totalEmployees(labor),
    prodEmployees: prodEmployees(labor),
    workHours: totalWorkHours(labor),
    retireProd: retireProdTotal(labor),

    // 계산 지표 (calcLaborMetrics로도 구할 수 있지만 편의상 직접 계산)
    valueAddedRatio: sales(plTotal) ? va / sales(plTotal) : 0,
    laborProductivity: totalEmployees(labor) ? va / totalEmployees(labor) : 0,
    laborIncomeRatio: va ? laborCostTotal / va : 0,
    retireRatio: va ? retireTotalVal / va : 0,
    totalPersonnelRatio: va ? (laborCostTotal + retireTotalVal) / va : 0,
    laborCostToSales: sales(plTotal) ? laborCostTotal / sales(plTotal) : 0,
    wagePerPerson: totalEmployees(labor) ? laborCostTotal / totalEmployees(labor) : 0,
    retirePerPerson: prodEmployees(labor) ? retireProdTotal(labor) / prodEmployees(labor) : 0,
    hourlyWage: totalWorkHours(labor) ? laborCostTotal / totalWorkHours(labor) : 0,
    prodPerPerson: prodEmployees(labor) ? plTotal.prodAmount / prodEmployees(labor) : 0,
    prodPerWon: (laborCostTotal + retireProdTotal(labor))
      ? plTotal.prodAmount / (laborCostTotal + retireProdTotal(labor))
      : 0,
  };
}

/**
 * 사업부별 노동생산성 계산
 * 노무비 RKM/HKMC 배분: 근무시간 비율로 1차 배분 후 상여금은 실제 지급액으로 조정
 */
export function calcLaborProductivityByDivision(
  plRkm: FactoryPL,
  plHkmc: FactoryPL,
  labor: LaborInput,
  laborCostTotal: number,
): [LaborProductivity, LaborProductivity] {
  // 근무시간 비율로 기본급 배분
  const baseCost = laborCostTotal - (labor.bonusProdRkm + labor.bonusProdHkmc);
  const baseRkm = baseCost * rkmRatio(labor);
  const baseHkmc = baseCost * hkmcRatio(labor);

  const laborRkm = baseRkm + labor.bonusProdRkm;
  const laborHkmc = baseHkmc + labor.bonusProdHkmc;

  const retireRkm = labor.retireMgmtRkm + labor.retireProdRkm;
  const retireHkmc = labor.retireMgmtHkmc + labor.retireProdHkmc;

  const vaRkm = calcValueAdded(plRkm);
  const vaHkmc = calcValueAdded(plHkmc);

  const sRkm = sales(plRkm);
  const sHkmc = sales(plHkmc);
  const empRkm = rkmEmployees(labor);
  const empHkmc = hkmcEmployees(labor);
  const peRkm = labor.prodRkm;
  const peHkmc = labor.prodHkmc;
  const whRkm = labor.workHoursRkm;
  const whHkmc = labor.workHoursHkmc;

  const lpRkm: LaborProductivity = {
    sales: sRkm,
    valueAdded: vaRkm,
    laborCost: laborRkm,
    retireCost: retireRkm,
    prodAmount: plRkm.prodAmount,
    employees: empRkm,
    prodEmployees: peRkm,
    workHours: whRkm,
    retireProd: labor.retireProdRkm,
    valueAddedRatio: sRkm ? vaRkm / sRkm : 0,
    laborProductivity: empRkm ? vaRkm / empRkm : 0,
    laborIncomeRatio: vaRkm ? laborRkm / vaRkm : 0,
    retireRatio: vaRkm ? retireRkm / vaRkm : 0,
    totalPersonnelRatio: vaRkm ? (laborRkm + retireRkm) / vaRkm : 0,
    laborCostToSales: sRkm ? laborRkm / sRkm : 0,
    wagePerPerson: empRkm ? laborRkm / empRkm : 0,
    retirePerPerson: peRkm ? labor.retireProdRkm / peRkm : 0,
    hourlyWage: whRkm ? laborRkm / whRkm : 0,
    prodPerPerson: peRkm ? plRkm.prodAmount / peRkm : 0,
    prodPerWon: (laborRkm + labor.retireProdRkm)
      ? plRkm.prodAmount / (laborRkm + labor.retireProdRkm)
      : 0,
  };

  const lpHkmc: LaborProductivity = {
    sales: sHkmc,
    valueAdded: vaHkmc,
    laborCost: laborHkmc,
    retireCost: retireHkmc,
    prodAmount: plHkmc.prodAmount,
    employees: empHkmc,
    prodEmployees: peHkmc,
    workHours: whHkmc,
    retireProd: labor.retireProdHkmc,
    valueAddedRatio: sHkmc ? vaHkmc / sHkmc : 0,
    laborProductivity: empHkmc ? vaHkmc / empHkmc : 0,
    laborIncomeRatio: vaHkmc ? laborHkmc / vaHkmc : 0,
    retireRatio: vaHkmc ? retireHkmc / vaHkmc : 0,
    totalPersonnelRatio: vaHkmc ? (laborHkmc + retireHkmc) / vaHkmc : 0,
    laborCostToSales: sHkmc ? laborHkmc / sHkmc : 0,
    wagePerPerson: empHkmc ? laborHkmc / empHkmc : 0,
    retirePerPerson: peHkmc ? labor.retireProdHkmc / peHkmc : 0,
    hourlyWage: whHkmc ? laborHkmc / whHkmc : 0,
    prodPerPerson: peHkmc ? plHkmc.prodAmount / peHkmc : 0,
    prodPerWon: (laborHkmc + labor.retireProdHkmc)
      ? plHkmc.prodAmount / (laborHkmc + labor.retireProdHkmc)
      : 0,
  };

  return [lpRkm, lpHkmc];
}

// ── DB → 타입 변환 ───────────────────────────────────────────

/** DB 레코드에서 공장별 FactoryPL 생성 */
export function buildFactoryPLFromDB(data: Record<string, number>, factory: string): FactoryPL {
  const s = `_${factory}`;
  const g = (key: string) => n(data[`${key}${s}`]);

  return {
    name: factory,
    qty: g('qty'),
    prodAmount: g('prod'),
    salesProd: g('sales_prod'),
    salesOut: g('sales_out'),
    invDiff: g('inv_diff'),
    material: g('material'),
    mfgWelfare: g('mfg_welfare'),
    mfgPower: g('mfg_power'),
    mfgTrans: g('mfg_trans'),
    mfgRepair: g('mfg_repair'),
    mfgSupplies: g('mfg_supplies'),
    mfgFee: g('mfg_fee'),
    mfgOther: g('mfg_other'),
    mfgWater: g('mfg_water'),
    mfgInsurance: g('mfg_insurance'),
    sellingTrans: g('selling_trans'),
    merchPurchase: g('merch_purchase'),
    laborSalary: g('labor_salary'),
    laborWage: g('labor_wage'),
    laborBonus: g('labor_bonus'),
    laborRetire: g('labor_retire'),
    laborOutsrc: g('labor_outsrc'),
    staffSalary: g('staff_salary'),
    staffBonus: g('staff_bonus'),
    staffRetire: g('staff_retire'),
    fixDepr: g('fix_depr'),
    fixLease: g('fix_lease'),
    fixOutsrc: g('fix_outsrc'),
    fixOther: g('fix_other'),
    nonOpIncome: n(data['non_op_income']),
    nonOpExpense: n(data['non_op_expense']),
    interestIncome: n(data['interest_income']),
    interestExpense: n(data['interest_expense']),
  };
}

/** DB 레코드에서 LaborInput 생성 */
export function buildLaborInputFromDB(data: Record<string, number>): LaborInput {
  return {
    mgmtRkm: n(data['mgmt_rkm']),
    mgmtHkmc: n(data['mgmt_hkmc']),
    prodRkm: n(data['prod_rkm']),
    prodHkmc: n(data['prod_hkmc']),
    hireCount: n(data['hire_count']),
    resignCount: n(data['resign_count']),
    workHoursRkm: n(data['work_hours_rkm']),
    workHoursHkmc: n(data['work_hours_hkmc']),
    overtimeGimhae: n(data['overtime_gimhae']),
    overtimeBusan: n(data['overtime_busan']),
    bonusProdRkm: n(data['bonus_prod_rkm']),
    bonusProdHkmc: n(data['bonus_prod_hkmc']),
    retireMgmtRkm: n(data['retire_mgmt_rkm']),
    retireMgmtHkmc: n(data['retire_mgmt_hkmc']),
    retireProdRkm: n(data['retire_prod_rkm']),
    retireProdHkmc: n(data['retire_prod_hkmc']),
  };
}
