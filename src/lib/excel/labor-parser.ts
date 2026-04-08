// ============================================================
// 인원·노무비 Excel 파서 — 02_인원_노무비_입력.py 포팅
// ExcelJS 기반 서버사이드 파싱
// ============================================================

import ExcelJS from 'exceljs';

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

function cellStr(ws: ExcelJS.Worksheet, row: number, col: number): string {
  const cell = ws.getCell(row, col);
  const v = cell.value;
  return v != null ? String(v).trim() : '';
}

export interface LaborParseResult {
  sheetsUsed: string[];
  dbData: Record<string, number>;
}

export async function parseLaborExcel(buffer: Buffer): Promise<LaborParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  if (wb.worksheets.length < 2) {
    throw new Error(`시트가 2개 이상이어야 합니다 (현재 ${wb.worksheets.length}개)`);
  }

  let wsLabor: ExcelJS.Worksheet | null = null;
  let wsBonus: ExcelJS.Worksheet | null = null;
  let nameLabor = '';
  let nameBonus = '';

  // 시트 자동 인식
  for (const ws of wb.worksheets) {
    // 인원,근무시간 시트: R3 C3 = "RKM"
    if (cellStr(ws, 3, 3) === 'RKM' && cellVal(ws, 4, 3) > 0) {
      wsLabor = ws;
      nameLabor = ws.name;
    }
    // 상여·퇴직 시트: R4 C4에 "RKM" 포함
    else if (cellStr(ws, 4, 4).includes('RKM') && cellVal(ws, 8, 5) > 0) {
      wsBonus = ws;
      nameBonus = ws.name;
    }
  }

  if (!wsLabor) {
    throw new Error("'노무비(인원,근무시간)' 시트를 찾을 수 없습니다. R3 C3에 'RKM' 헤더가 있어야 합니다.");
  }
  if (!wsBonus) {
    throw new Error("'노무비(상여·퇴직)' 시트를 찾을 수 없습니다. R4 C4에 'RKM' 헤더가 있어야 합니다.");
  }

  // 인원·근무시간 파싱
  const dbData: Record<string, number> = {
    mgmt_rkm: cellVal(wsLabor, 4, 3),
    mgmt_hkmc: cellVal(wsLabor, 4, 4),
    prod_rkm: cellVal(wsLabor, 5, 3),
    prod_hkmc: cellVal(wsLabor, 5, 4),
    hire_count: 0,
    resign_count: 0,
    work_hours_rkm: cellVal(wsLabor, 16, 3),
    work_hours_hkmc: cellVal(wsLabor, 17, 3),
    overtime_gimhae: cellVal(wsLabor, 16, 6),
    overtime_busan: cellVal(wsLabor, 17, 6),
    base_hours_gimhae: cellVal(wsLabor, 16, 7),
    base_hours_busan: cellVal(wsLabor, 17, 7),
    // 상여·퇴직 파싱
    bonus_prod_rkm: cellVal(wsBonus, 8, 5),
    bonus_prod_hkmc: cellVal(wsBonus, 8, 10),
    retire_mgmt_rkm: cellVal(wsBonus, 13, 5),
    retire_mgmt_hkmc: cellVal(wsBonus, 13, 10),
    retire_prod_rkm: cellVal(wsBonus, 14, 5),
    retire_prod_hkmc: cellVal(wsBonus, 14, 10),
  };

  return {
    sheetsUsed: [nameLabor, nameBonus],
    dbData,
  };
}
