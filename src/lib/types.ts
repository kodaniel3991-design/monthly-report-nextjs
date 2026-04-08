// ============================================================
// 진양오토모티브 월차보고 시스템 — TypeScript 타입 정의
// ============================================================

/** 공장 코드 */
export type FactoryCode = 'gimhae' | 'busan' | 'ulsan' | 'gimhae2';

/** 사업부 코드 */
export type DivisionCode = 'rkm' | 'hkmc';

// --------------------------------------------------
// 손익실적 (P&L)
// --------------------------------------------------

/** 공장별 손익 데이터 (단위: 천원) */
export interface FactoryPL {
  name: string;
  qty: number;           // 판매수량
  prodAmount: number;    // 생산금액

  // 매출
  salesProd: number;     // 제품매출
  salesOut: number;      // 외주매출

  // 변동비
  invDiff: number;       // 재고자산변동
  material: number;      // 재료비
  mfgWelfare: number;    // 복리후생비(변동)
  mfgPower: number;      // 동력비
  mfgTrans: number;      // 운반비
  mfgRepair: number;     // 수선비
  mfgSupplies: number;   // 소모품비
  mfgFee: number;        // 수수료
  mfgOther: number;      // 기타제조경비
  mfgWater: number;      // 수도광열비
  mfgInsurance: number;  // 보험료
  sellingTrans: number;  // 판매운반비
  merchPurchase: number; // 상품매입

  // 고정비 — 노무비
  laborSalary: number;   // 급여
  laborWage: number;     // 임금
  laborBonus: number;    // 상여
  laborRetire: number;   // 퇴직급여
  laborOutsrc: number;   // 외주가공비

  // 고정비 — 판관비
  staffSalary: number;   // 판관급여
  staffBonus: number;    // 판관상여
  staffRetire: number;   // 판관퇴직급여

  // 고정비 — 제조고정비
  fixDepr: number;       // 감가상각비
  fixLease: number;      // 리스비(사용권)
  fixOutsrc: number;     // 외주가공비(고정)
  fixOther: number;      // 기타고정제조경비

  // 영업외
  nonOpIncome: number;   // 영업외수익
  nonOpExpense: number;  // 영업외비용
  interestIncome: number;  // 이자수익
  interestExpense: number; // 이자비용
}

// --------------------------------------------------
// 인원·노무비
// --------------------------------------------------

/** 인원·근무시간·상여·퇴직 데이터 */
export interface LaborInput {
  // 인원 (명)
  mgmtRkm: number;
  mgmtHkmc: number;
  prodRkm: number;
  prodHkmc: number;

  // 입퇴사
  hireCount: number;
  resignCount: number;

  // 근무시간 (시간)
  workHoursRkm: number;
  workHoursHkmc: number;
  overtimeGimhae: number;
  overtimeBusan: number;

  // 상여금 (천원)
  bonusProdRkm: number;
  bonusProdHkmc: number;

  // 퇴직급여 (천원)
  retireMgmtRkm: number;
  retireMgmtHkmc: number;
  retireProdRkm: number;
  retireProdHkmc: number;
}

/** 노동생산성 지표 */
export interface LaborProductivity {
  sales: number;
  valueAdded: number;
  laborCost: number;
  retireCost: number;
  prodAmount: number;
  employees: number;
  prodEmployees: number;
  workHours: number;
  retireProd: number;

  // 계산 지표
  valueAddedRatio: number;      // 부가가치율
  laborProductivity: number;    // 노동생산성 (천원/인)
  laborIncomeRatio: number;     // 근로소득배분율
  retireRatio: number;          // 퇴직금비율
  totalPersonnelRatio: number;  // 총인건비비율
  laborCostToSales: number;     // 인건비율
  wagePerPerson: number;        // 1인당임금 (천원/인/월)
  retirePerPerson: number;      // 1인당퇴직금
  hourlyWage: number;           // 시간당임금 (천원/h)
  prodPerPerson: number;        // 1인당생산
  prodPerWon: number;           // 노동장비율
}

// --------------------------------------------------
// 사업계획
// --------------------------------------------------

export interface AnnualPlanRow {
  id?: number;
  year: number;
  month: number;
  itemCode: string;
  itemName: string;
  value: number;
}

// --------------------------------------------------
// 업계동향
// --------------------------------------------------

export interface IndustryNews {
  id?: number;
  year: number;
  month: number;
  company: string;
  headline: string;
  content: string;
  source: string;
  seq: number;
}

export interface MarketShare {
  id?: number;
  year: number;
  month: number;
  company: string;
  sharePct: number;
}

export interface TopModel {
  id?: number;
  year: number;
  month: number;
  rank: number;
  modelName: string;
  company: string;
  salesQty: number;
}

// --------------------------------------------------
// 운영실적
// --------------------------------------------------

export type OperationSection =
  | 'summary'
  | 'sales'
  | 'production'
  | 'cost'
  | 'hr'
  | 'investment'
  | 'issues';

export interface MonthlyOperation {
  id?: number;
  year: number;
  month: number;
  section: OperationSection;
  sectionName: string;
  content: string;
}

// --------------------------------------------------
// 회계팀 자료
// --------------------------------------------------

export interface MonthlyAcctRow {
  id?: number;
  year: number;
  month: number;
  itemCode: string;
  itemName: string;
  value: number;
}
