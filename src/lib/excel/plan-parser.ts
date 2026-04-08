// ============================================================
// 사업계획 Excel 파서 — 06_사업계획_입력.py 포팅
// ============================================================

import ExcelJS from 'exceljs';

const PLAN_ROW_MAP: [string, string, number, string][] = [
  ['qty', '판매수량(대)', 7, 'input'],
  ['prod', '생산금액', 8, 'input'],
  ['sales', '매출액', 9, 'calc'],
  ['sales_prod', '  제품매출', 10, 'input'],
  ['sales_out', '  상품매출', 11, 'input'],
  ['variable_cost', '변동비', 12, 'calc'],
  ['inv_diff', '  제품재고증감차', 13, 'input'],
  ['material', '  재료비', 14, 'input'],
  ['mfg_expense', '  제조경비(변동)', 15, 'input'],
  ['selling_trans', '  판매운반비', 26, 'input'],
  ['merch_purchase', '  상품매입', 27, 'input'],
  ['contribution', '한계이익', 28, 'calc'],
  ['fixed_cost', '고정비', 29, 'calc'],
  ['labor_cost', '  노무비', 30, 'input'],
  ['staff_cost', '  인건비', 36, 'input'],
  ['fix_mfg', '  제조경비(고정)', 40, 'input'],
  ['general_admin', '  일반관리비', 52, 'input'],
  ['operating_profit', '영업이익', 60, 'calc'],
  ['non_op_income', '영업외수익', 61, 'input'],
  ['non_op_expense', '영업외비용', 63, 'input'],
  ['ordinary_profit', '경상이익', 65, 'calc'],
];

const COL_OFFSETS: Record<string, number> = {
  gimhae: 0, busan: 1, rkm: 2, ulsan: 4, gimhae2: 5, hkmc: 6, total: 8,
};

const ALL_KEYS = ['gimhae', 'busan', 'rkm', 'ulsan', 'gimhae2', 'hkmc', 'total'];

function monthCol(month: number, key: string): number {
  const base = month <= 6 ? 28 + (month - 1) * 10 : 98 + (month - 7) * 10;
  return base + COL_OFFSETS[key];
}

function cellVal(ws: ExcelJS.Worksheet, row: number, col: number): number {
  const cell = ws.getCell(row, col);
  const v = cell.value;
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'result' in v) {
    return typeof v.result === 'number' ? v.result : 0;
  }
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export interface PlanParseResult {
  sheetName: string;
  months: Record<number, Record<string, number>>;
}

export async function parsePlanExcel(buffer: Buffer): Promise<PlanParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  // "사업계획" 키워드 시트 찾기
  let ws = wb.worksheets[0];
  for (const sheet of wb.worksheets) {
    if (sheet.name.includes('사업계획') || sheet.name.includes('계획')) {
      ws = sheet;
      break;
    }
  }

  const months: Record<number, Record<string, number>> = {};

  for (let month = 1; month <= 12; month++) {
    const monthData: Record<string, number> = {};
    for (const [itemCode, , rowNum] of PLAN_ROW_MAP) {
      for (const key of ALL_KEYS) {
        const col = monthCol(month, key);
        monthData[`${itemCode}_${key}`] = cellVal(ws, rowNum, col);
      }
    }
    months[month] = monthData;
  }

  return { sheetName: ws.name, months };
}

export { PLAN_ROW_MAP, ALL_KEYS };
