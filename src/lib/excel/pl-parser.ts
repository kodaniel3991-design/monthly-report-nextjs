// ============================================================
// 손익실적 Excel 파서 — 01_손익실적_입력.py 포팅
// ExcelJS 기반 서버사이드 파싱
// ============================================================

import ExcelJS from 'exceljs';

// 공장별 컬럼 위치 (1-based)
const FACTORY_COLS: Record<string, number> = {
  gimhae: 8,
  busan: 10,
  ulsan: 14,
  gimhae2: 16,
};

// 사업부/합계 컬럼 (미리보기용)
const DIVISION_COLS: Record<string, number> = {
  rkm: 12,
  hkmc: 18,
  total: 20,
};

const ALL_COLS: Record<string, number> = { ...FACTORY_COLS, ...DIVISION_COLS };

// (DB 필드 prefix, 항목명, Excel 행번호, 유형)
const PL_ROW_MAP: [string, string, number, string][] = [
  ['qty', '판매수량(대)', 6, 'input'],
  ['prod', '생산금액', 7, 'input'],
  ['_sales', '매출액', 8, 'calc'],
  ['sales_prod', '  생산품매출', 9, 'input'],
  ['sales_out', '  상품매출', 10, 'input'],
  ['_variable_cost', '변동비', 11, 'calc'],
  ['inv_diff', '  제품재고증감차', 12, 'input'],
  ['material', '  재료비', 13, 'input'],
  ['_mfg_var_sub', '  제조경비(변동)', 14, 'calc'],
  ['mfg_welfare', '    복리후생비★', 15, 'input'],
  ['mfg_power', '    전력비', 16, 'input'],
  ['mfg_trans', '    운반비', 17, 'input'],
  ['mfg_repair', '    수선비', 18, 'input'],
  ['mfg_supplies', '    소모품비', 19, 'input'],
  ['mfg_fee', '    지급수수료', 20, 'input'],
  ['mfg_other', '    기타(변동)', -1, 'sum_rows'],
  ['selling_trans', '  판매운반비', 25, 'input'],
  ['merch_purchase', '  상품매입', 26, 'input'],
  ['_margin', '한계이익', 27, 'calc'],
  ['_fixed_cost', '고정비', 28, 'calc'],
  ['_labor_sub', '  노무비', 29, 'calc'],
  ['labor_salary', '    급료', 30, 'input'],
  ['labor_wage', '    임금', 31, 'input'],
  ['labor_bonus', '    상여금', 32, 'input'],
  ['labor_retire', '    퇴충전입액', 33, 'input'],
  ['labor_outsrc', '    외주용역비', 34, 'input'],
  ['_staff_sub', '  인건비', 35, 'calc'],
  ['staff_salary', '    급료(인건비)', 36, 'input'],
  ['staff_bonus', '    상여(인건비)', 37, 'input'],
  ['staff_retire', '    퇴충(인건비)', 38, 'input'],
  ['_fix_mfg_sub', '  제조경비(고정)', 39, 'calc'],
  ['fix_lease', '    지급임차료', 41, 'input'],
  ['fix_depr', '    감가상각비', 43, 'input'],
  ['fix_outsrc', '    외주가공비', 46, 'input'],
  ['fix_other', '    기타(고정)', -2, 'sum_rows'],
  ['_ga_sub', '  일반관리비', 51, 'calc'],
  ['_op_profit', '영업이익', 61, 'calc'],
  ['non_op_income', '영업외수익', 62, 'total_only'],
  ['interest_income', '  이자수익', 63, 'total_only'],
  ['non_op_expense', '영업외비용', 64, 'total_only'],
  ['interest_expense', '  이자비용', 65, 'total_only'],
  ['_ordinary', '경상이익', 66, 'calc'],
];

// 합산 행 번호
const MFG_OTHER_ROWS = [21, 22, 23, 24];
const FIX_OTHER_ROWS = [40, 42, 44, 45, 47, 48, 49, 50];

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

export interface PLParseResult {
  sheetName: string;
  dbData: Record<string, number>;
  preview: Record<string, { label: string; values: Record<string, number> }>;
}

export async function parsePLExcel(buffer: Buffer): Promise<PLParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error('시트를 찾을 수 없습니다');

  const dbData: Record<string, number> = {};

  for (const [field, , rowNum, kind] of PL_ROW_MAP) {
    if (field.startsWith('_')) continue;

    if (kind === 'input') {
      for (const [fcode, col] of Object.entries(FACTORY_COLS)) {
        dbData[`${field}_${fcode}`] = cellVal(ws, rowNum, col);
      }
    } else if (kind === 'sum_rows') {
      const sumRows = field === 'mfg_other' ? MFG_OTHER_ROWS : FIX_OTHER_ROWS;
      for (const [fcode, col] of Object.entries(FACTORY_COLS)) {
        dbData[`${field}_${fcode}`] = sumRows.reduce((s, r) => s + cellVal(ws, r, col), 0);
      }
    } else if (kind === 'total_only') {
      dbData[field] = cellVal(ws, rowNum, DIVISION_COLS['total']);
    }
  }

  // 미리보기용 전체 데이터
  const preview: Record<string, { label: string; values: Record<string, number> }> = {};
  for (const [field, label, rowNum, kind] of PL_ROW_MAP) {
    const values: Record<string, number> = {};
    if (kind === 'sum_rows') {
      const sumRows = field === 'mfg_other' ? MFG_OTHER_ROWS : FIX_OTHER_ROWS;
      for (const [key, col] of Object.entries(ALL_COLS)) {
        values[key] = sumRows.reduce((s, r) => s + cellVal(ws, r, col), 0);
      }
    } else if (rowNum > 0) {
      for (const [key, col] of Object.entries(ALL_COLS)) {
        values[key] = cellVal(ws, rowNum, col);
      }
    }
    preview[field] = { label, values };
  }

  return { sheetName: ws.name, dbData, preview };
}
