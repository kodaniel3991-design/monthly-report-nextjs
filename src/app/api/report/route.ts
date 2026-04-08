import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { loadMonthlyPL, loadMonthlyLabor, loadIndustryNews, loadTopModels, loadMarketShare } from '@/lib/supabase/queries';
import {
  buildFactoryPLFromDB, buildLaborInputFromDB,
  sumFactories, sales, variableCost, contributionMargin,
  laborCost, staffCost, fixMfgExpense, fixedCost,
  operatingProfit, ordinaryProfit, calcValueAdded, mfgExpense,
  calcLaborProductivityTotal, calcLaborProductivityByDivision,
  totalEmployees, prodEmployees, totalWorkHours, retireTotal, pct,
} from '@/lib/calculator';
import type { FactoryPL } from '@/lib/types';

// 색상 상수
const HDR_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D1C7' } };
const RKM_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F1FB' } };
const HKMC_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1F5EE' } };
const TOTAL_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAEEDA' } };

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
};

function num(v: number): number { return Math.round(v); }

function addPLRow(ws: ExcelJS.Worksheet, rowNum: number, label: string, indent: number,
  factories: FactoryPL[], getValue: (pl: FactoryPL) => number, isPct: boolean = false) {
  const row = ws.getRow(rowNum);
  row.getCell(1).value = '  '.repeat(indent) + label;
  row.getCell(1).font = { name: 'Arial', size: 9 };

  // 김해, 부산, RKM, 울산, 김해2, HKMC, 합계
  const divisions = [
    factories[0], factories[1], factories[4], // gimhae, busan, rkm
    factories[2], factories[3], factories[5], // ulsan, gimhae2, hkmc
    factories[6], // total
  ];

  const cols = [2, 4, 6, 8, 10, 12, 14];
  const fills = [null, null, RKM_FILL, null, null, HKMC_FILL, TOTAL_FILL];

  divisions.forEach((pl, i) => {
    const val = getValue(pl);
    const amtCell = row.getCell(cols[i]);
    amtCell.value = isPct ? undefined : num(val);
    amtCell.numFmt = '#,##0';
    amtCell.font = { name: 'Arial', size: 9 };
    amtCell.border = THIN_BORDER;
    if (fills[i]) amtCell.fill = fills[i]!;

    // % 열
    const pctCell = row.getCell(cols[i] + 1);
    const s = sales(pl);
    pctCell.value = s ? val / s : 0;
    pctCell.numFmt = '0.00%';
    pctCell.font = { name: 'Arial', size: 8 };
    pctCell.border = THIN_BORDER;
    if (fills[i]) pctCell.fill = fills[i]!;
  });
}

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();
    if (!year || !month) {
      return NextResponse.json({ error: 'year, month 필수' }, { status: 400 });
    }

    const [plData, laborData, newsData, topModelData, msData] = await Promise.all([
      loadMonthlyPL(year, month),
      loadMonthlyLabor(year, month),
      loadIndustryNews(year, month),
      loadTopModels(year, month),
      loadMarketShare(year, month),
    ]);

    const gimhae = buildFactoryPLFromDB(plData, 'gimhae');
    const busan = buildFactoryPLFromDB(plData, 'busan');
    const ulsan = buildFactoryPLFromDB(plData, 'ulsan');
    const gimhae2 = buildFactoryPLFromDB(plData, 'gimhae2');
    const rkm = sumFactories('RKM', gimhae, busan);
    const hkmc = sumFactories('HKMC', ulsan, gimhae2);
    const total = sumFactories('계', gimhae, busan, ulsan, gimhae2);
    const allPL = [gimhae, busan, ulsan, gimhae2, rkm, hkmc, total];

    const wb = new ExcelJS.Workbook();

    // ── Sheet 1: 손익실적 ─────────────────────
    const ws1 = wb.addWorksheet('손익실적');
    ws1.columns = Array.from({ length: 16 }, () => ({ width: 12 }));
    ws1.getColumn(1).width = 20;

    // 헤더
    const hdr = ws1.getRow(1);
    hdr.getCell(1).value = `${year}년 ${month}월 손익실적`;
    hdr.getCell(1).font = { name: 'Arial', size: 12, bold: true };

    const hdr2 = ws1.getRow(2);
    const headers = ['항목', '김해', '%', '부산', '%', 'RKM', '%', '울산', '%', '김해2', '%', 'HKMC', '%', '합계', '%'];
    headers.forEach((h, i) => {
      const cell = hdr2.getCell(i + 1);
      cell.value = h;
      cell.fill = HDR_FILL;
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center' };
    });

    // 데이터 행
    let r = 3;
    const rows: [string, number, (pl: FactoryPL) => number][] = [
      ['판매수량(대)', 0, (pl) => pl.qty],
      ['생산금액', 0, (pl) => pl.prodAmount],
      ['매출액', 0, (pl) => sales(pl)],
      ['  생산품매출', 1, (pl) => pl.salesProd],
      ['  상품매출', 1, (pl) => pl.salesOut],
      ['변동비', 0, (pl) => variableCost(pl)],
      ['  재고증감차', 1, (pl) => pl.invDiff],
      ['  재료비', 1, (pl) => pl.material],
      ['  제조경비(변동)', 1, (pl) => mfgExpense(pl)],
      ['    복리후생비', 2, (pl) => pl.mfgWelfare],
      ['    전력비', 2, (pl) => pl.mfgPower],
      ['    운반비', 2, (pl) => pl.mfgTrans],
      ['    수선비', 2, (pl) => pl.mfgRepair],
      ['    소모품비', 2, (pl) => pl.mfgSupplies],
      ['    수수료', 2, (pl) => pl.mfgFee],
      ['    기타', 2, (pl) => pl.mfgOther],
      ['  판매운반비', 1, (pl) => pl.sellingTrans],
      ['  상품매입', 1, (pl) => pl.merchPurchase],
      ['한계이익', 0, (pl) => contributionMargin(pl)],
      ['고정비', 0, (pl) => fixedCost(pl)],
      ['  노무비', 1, (pl) => laborCost(pl)],
      ['  인건비', 1, (pl) => staffCost(pl)],
      ['  제조경비(고정)', 1, (pl) => fixMfgExpense(pl)],
      ['영업이익', 0, (pl) => operatingProfit(pl)],
      ['부가가치', 0, (pl) => calcValueAdded(pl)],
    ];

    for (const [label, indent, fn] of rows) {
      addPLRow(ws1, r, label, indent, allPL, fn);
      if (indent === 0) {
        ws1.getRow(r).getCell(1).font = { name: 'Arial', size: 9, bold: true };
      }
      r++;
    }

    // ── Sheet 2: 노동생산성 ─────────────────────
    const labor = buildLaborInputFromDB(laborData);
    const totalLC = laborCost(total);
    const totalRT = retireTotal(labor);
    const lpTotal = calcLaborProductivityTotal(total, labor, totalLC, totalRT);
    const [lpRkm, lpHkmc] = calcLaborProductivityByDivision(rkm, hkmc, labor, totalLC);

    const ws2 = wb.addWorksheet('노동생산성');
    ws2.columns = [{ width: 20 }, { width: 15 }, { width: 15 }, { width: 15 }];

    ws2.getRow(1).getCell(1).value = `${year}년 ${month}월 노동생산성`;
    ws2.getRow(1).getCell(1).font = { name: 'Arial', size: 12, bold: true };

    const lpHdr = ws2.getRow(2);
    ['지표', 'RKM', 'HKMC', '전체'].forEach((h, i) => {
      const cell = lpHdr.getCell(i + 1);
      cell.value = h;
      cell.fill = HDR_FILL;
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center' };
    });

    const lpRows: [string, number, number, number][] = [
      ['매출액 (천원)', lpRkm.sales, lpHkmc.sales, lpTotal.sales],
      ['부가가치 (천원)', lpRkm.valueAdded, lpHkmc.valueAdded, lpTotal.valueAdded],
      ['부가가치율 (%)', lpRkm.valueAddedRatio * 100, lpHkmc.valueAddedRatio * 100, lpTotal.valueAddedRatio * 100],
      ['종업원수 (명)', lpRkm.employees, lpHkmc.employees, lpTotal.employees],
      ['노동생산성 (천원/인)', lpRkm.laborProductivity, lpHkmc.laborProductivity, lpTotal.laborProductivity],
      ['근로소득배분율 (%)', lpRkm.laborIncomeRatio * 100, lpHkmc.laborIncomeRatio * 100, lpTotal.laborIncomeRatio * 100],
      ['인건비율 (%)', lpRkm.laborCostToSales * 100, lpHkmc.laborCostToSales * 100, lpTotal.laborCostToSales * 100],
      ['1인당 임금 (천원)', lpRkm.wagePerPerson, lpHkmc.wagePerPerson, lpTotal.wagePerPerson],
      ['시간당 임금 (천원/h)', lpRkm.hourlyWage, lpHkmc.hourlyWage, lpTotal.hourlyWage],
      ['실작업시간 (h)', lpRkm.workHours, lpHkmc.workHours, lpTotal.workHours],
    ];

    lpRows.forEach(([label, rVal, hVal, tVal], i) => {
      const row = ws2.getRow(i + 3);
      row.getCell(1).value = label;
      row.getCell(1).font = { name: 'Arial', size: 9 };
      const isPct = label.includes('%');
      const fmt = isPct ? '0.00' : '#,##0';
      [rVal, hVal, tVal].forEach((v, j) => {
        const cell = row.getCell(j + 2);
        cell.value = isPct ? Math.round(v * 100) / 100 : Math.round(v);
        cell.numFmt = fmt;
        cell.font = { name: 'Arial', size: 9 };
        cell.border = THIN_BORDER;
        if (j === 0) cell.fill = RKM_FILL;
        if (j === 1) cell.fill = HKMC_FILL;
        if (j === 2) cell.fill = TOTAL_FILL;
      });
    });

    // ── Sheet 3: 업계동향 ─────────────────────
    const ws3 = wb.addWorksheet('업계동향');
    ws3.columns = [{ width: 5 }, { width: 30 }, { width: 50 }, { width: 15 }];

    ws3.getRow(1).getCell(1).value = `${year}년 ${month}월 업계동향`;
    ws3.getRow(1).getCell(1).font = { name: 'Arial', size: 12, bold: true };

    const newsHdr = ws3.getRow(2);
    ['No', '제목', '내용', '출처'].forEach((h, i) => {
      const cell = newsHdr.getCell(i + 1);
      cell.value = h;
      cell.fill = HDR_FILL;
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.border = THIN_BORDER;
    });

    let nr = 3;
    const grouped: Record<string, typeof newsData> = {};
    for (const item of newsData) {
      const co = (item as Record<string, string>).company ?? '';
      if (!grouped[co]) grouped[co] = [];
      grouped[co].push(item);
    }
    for (const [company, items] of Object.entries(grouped)) {
      const compRow = ws3.getRow(nr);
      compRow.getCell(1).value = company;
      compRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      nr++;
      items.forEach((item: Record<string, unknown>, i: number) => {
        const row = ws3.getRow(nr);
        row.getCell(1).value = i + 1;
        row.getCell(2).value = (item as Record<string, string>).headline ?? '';
        row.getCell(3).value = (item as Record<string, string>).content ?? '';
        row.getCell(4).value = (item as Record<string, string>).source ?? '';
        row.getCell(3).alignment = { wrapText: true };
        [1, 2, 3, 4].forEach((c) => { row.getCell(c).border = THIN_BORDER; row.getCell(c).font = { name: 'Arial', size: 9 }; });
        nr++;
      });
      nr++;
    }

    // TOP10
    if (topModelData.length > 0) {
      nr++;
      const topHdr = ws3.getRow(nr);
      topHdr.getCell(1).value = '판매 TOP 10';
      topHdr.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      nr++;
      ['순위', '모델명', '제조사', '판매량'].forEach((h, i) => {
        const cell = ws3.getRow(nr).getCell(i + 1);
        cell.value = h;
        cell.fill = HDR_FILL;
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.border = THIN_BORDER;
      });
      nr++;
      for (const m of topModelData) {
        const row = ws3.getRow(nr);
        row.getCell(1).value = (m as Record<string, number>).rank;
        row.getCell(2).value = (m as Record<string, string>).model_name;
        row.getCell(3).value = (m as Record<string, string>).company;
        row.getCell(4).value = (m as Record<string, number>).sales_qty;
        row.getCell(4).numFmt = '#,##0';
        [1, 2, 3, 4].forEach((c) => { row.getCell(c).border = THIN_BORDER; row.getCell(c).font = { name: 'Arial', size: 9 }; });
        nr++;
      }
    }

    // Excel 바이너리 생성
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${year}_${String(month).padStart(2, '0')}_monthly_report.xlsx"`,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
