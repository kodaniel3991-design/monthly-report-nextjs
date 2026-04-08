import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { loadMonthlyPL, loadMonthlyLabor } from '@/lib/supabase/queries';
import {
  buildFactoryPLFromDB, buildLaborInputFromDB,
  sumFactories, sales, calcValueAdded,
  laborCost, staffCost,
  totalEmployees, prodEmployees, totalWorkHours,
  rkmEmployees, hkmcEmployees,
  calcLaborProductivityTotal, calcLaborProductivityByDivision,
  retireTotal,
} from '@/lib/calculator';

export async function POST(request: NextRequest) {
  try {
    const { year, month, type } = await request.json();
    if (!year || !month || !type) {
      return NextResponse.json({ error: 'year, month, type 필수' }, { status: 400 });
    }

    const [plData, laborData] = await Promise.all([
      loadMonthlyPL(year, month),
      loadMonthlyLabor(year, month),
    ]);

    const gimhae = buildFactoryPLFromDB(plData, 'gimhae');
    const busan = buildFactoryPLFromDB(plData, 'busan');
    const ulsan = buildFactoryPLFromDB(plData, 'ulsan');
    const gimhae2 = buildFactoryPLFromDB(plData, 'gimhae2');
    const rkm = sumFactories('RKM', gimhae, busan);
    const hkmc = sumFactories('HKMC', ulsan, gimhae2);
    const total = sumFactories('계', gimhae, busan, ulsan, gimhae2);
    const labor = buildLaborInputFromDB(laborData);

    if (type === 'labor') {
      // 노동생산성 템플릿 기반
      const templatePath = path.join(process.cwd(), 'public', 'templates', '노동생산성_템플릿.xlsx');
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: '노동생산성 템플릿 파일이 없습니다' }, { status: 404 });
      }

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(templatePath);

      const totalLC = laborCost(total);
      const totalRT = retireTotal(labor);
      const lpTotal = calcLaborProductivityTotal(total, labor, totalLC, totalRT);
      const [lpRkm, lpHkmc] = calcLaborProductivityByDivision(rkm, hkmc, labor, totalLC);

      // 사업부별 시트 (2번째 시트)
      if (wb.worksheets.length >= 2) {
        const wsDiv = wb.worksheets[1];

        // 급여+상여 (퇴직 제외)
        const salaryBonus = (facs: string[]) => {
          let t = 0;
          for (const f of facs) {
            t += (plData[`labor_salary_${f}`] ?? 0)
              + (plData[`labor_wage_${f}`] ?? 0)
              + (plData[`labor_bonus_${f}`] ?? 0)
              + (plData[`labor_outsrc_${f}`] ?? 0)
              + (plData[`staff_salary_${f}`] ?? 0)
              + (plData[`staff_bonus_${f}`] ?? 0);
          }
          return t;
        };

        const retireWelfare = (facs: string[]) => {
          let t = 0;
          for (const f of facs) {
            t += (plData[`labor_retire_${f}`] ?? 0)
              + (plData[`staff_retire_${f}`] ?? 0);
          }
          return t;
        };

        const rkmFacs = ['gimhae', 'busan'];
        const hkmcFacs = ['ulsan', 'gimhae2'];

        // 값 채우기: C열=RKM, E열=HKMC
        const valueCells: Record<number, [number, number]> = {
          8: [calcValueAdded(rkm), calcValueAdded(hkmc)],
          9: [sales(rkm), sales(hkmc)],
          12: [salaryBonus(rkmFacs), salaryBonus(hkmcFacs)],
          26: [retireWelfare(rkmFacs), retireWelfare(hkmcFacs)],
          43: [rkm.prodAmount, hkmc.prodAmount],
        };

        for (const [row, [rVal, hVal]] of Object.entries(valueCells)) {
          wsDiv.getCell(Number(row), 3).value = rVal;
          wsDiv.getCell(Number(row), 5).value = hVal;
        }

        // 인원/시간 데이터
        wsDiv.getCell(11, 3).value = rkmEmployees(labor);
        wsDiv.getCell(11, 5).value = hkmcEmployees(labor);
        wsDiv.getCell(39, 3).value = labor.prodRkm;
        wsDiv.getCell(39, 5).value = labor.prodHkmc;
        wsDiv.getCell(40, 3).value = labor.workHoursRkm;
        wsDiv.getCell(40, 5).value = labor.workHoursHkmc;
        wsDiv.getCell(47, 3).value = labor.retireProdRkm;
        wsDiv.getCell(47, 5).value = labor.retireProdHkmc;

        // 합계 (C7열)
        wsDiv.getCell(8, 7).value = calcValueAdded(rkm) + calcValueAdded(hkmc);
        wsDiv.getCell(9, 7).value = sales(rkm) + sales(hkmc);
        wsDiv.getCell(11, 7).value = totalEmployees(labor);
        wsDiv.getCell(12, 7).value = salaryBonus(rkmFacs) + salaryBonus(hkmcFacs);
        wsDiv.getCell(26, 7).value = retireWelfare(rkmFacs) + retireWelfare(hkmcFacs);
        wsDiv.getCell(39, 7).value = prodEmployees(labor);
        wsDiv.getCell(40, 7).value = totalWorkHours(labor);
        wsDiv.getCell(43, 7).value = rkm.prodAmount + hkmc.prodAmount;
      }

      const buffer = await wb.xlsx.writeBuffer();
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="labor_productivity_${year}_${String(month).padStart(2, '0')}.xlsx"`,
        },
      });
    }

    if (type === 'industry') {
      // 업계동향 템플릿 기반
      const templatePath = path.join(process.cwd(), 'public', 'templates', '업계동향_템플릿.xlsx');
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: '업계동향 템플릿 파일이 없습니다' }, { status: 404 });
      }

      const { loadIndustryNews, loadTopModels, loadMarketShare } = await import('@/lib/supabase/queries');
      const [newsData, topModelData, msData] = await Promise.all([
        loadIndustryNews(year, month),
        loadTopModels(year, month),
        loadMarketShare(year, month),
      ]);

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(templatePath);

      const ws = wb.worksheets[0];
      if (!ws) {
        return NextResponse.json({ error: '템플릿 시트를 찾을 수 없습니다' }, { status: 500 });
      }

      // 뉴스 데이터 채우기
      let r = 4; // 데이터 시작 행
      const grouped: Record<string, typeof newsData> = {};
      for (const item of newsData) {
        const co = (item as Record<string, string>).company ?? '';
        if (!grouped[co]) grouped[co] = [];
        grouped[co].push(item);
      }

      for (const [company, items] of Object.entries(grouped)) {
        ws.getCell(r, 1).value = company;
        ws.getCell(r, 1).font = { name: 'Arial', size: 10, bold: true };
        r++;
        for (const item of items) {
          const rec = item as Record<string, string>;
          ws.getCell(r, 2).value = rec.headline ?? '';
          ws.getCell(r, 2).font = { name: 'Arial', size: 9, bold: true };
          r++;
          if (rec.source) {
            ws.getCell(r, 2).value = `<${rec.source}>`;
            ws.getCell(r, 2).font = { name: 'Arial', size: 8, italic: true };
            r++;
          }
          if (rec.content) {
            ws.getCell(r, 2).value = rec.content;
            ws.getCell(r, 2).font = { name: 'Arial', size: 9 };
            ws.getCell(r, 2).alignment = { wrapText: true };
            ws.getRow(r).height = Math.max(60, rec.content.length / 2);
            r++;
          }
          r++;
        }
        r++;
      }

      const buffer = await wb.xlsx.writeBuffer();
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="industry_news_${year}_${String(month).padStart(2, '0')}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ error: '알 수 없는 type' }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
