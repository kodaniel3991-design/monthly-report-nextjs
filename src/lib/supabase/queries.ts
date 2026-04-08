// ============================================================
// Supabase CRUD 헬퍼 — database.py 포팅
// ============================================================

import { createClient } from './client';

type SupabaseClient = ReturnType<typeof createClient>;

function getClient(): SupabaseClient {
  return createClient();
}

// ── 손익실적 ─────────────────────────────────────────────────

export async function saveMonthlyPL(year: number, month: number, data: Record<string, number>) {
  const supabase = getClient();
  const { error } = await supabase
    .from('monthly_pl')
    .upsert({ year, month, ...data }, { onConflict: 'year,month' });
  if (error) throw error;
}

export async function loadMonthlyPL(year: number, month: number): Promise<Record<string, number>> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_pl')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return (data as Record<string, number>) ?? {};
}

// ── 인원·노무비 ─────────────────────────────────────────────

export async function saveMonthlyLabor(year: number, month: number, data: Record<string, number>) {
  const supabase = getClient();
  const { error } = await supabase
    .from('monthly_labor')
    .upsert({ year, month, ...data }, { onConflict: 'year,month' });
  if (error) throw error;
}

export async function loadMonthlyLabor(year: number, month: number): Promise<Record<string, number>> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_labor')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as Record<string, number>) ?? {};
}

// ── 누계 조회 ───────────────────────────────────────────────

export async function loadAllMonths(year: number) {
  const supabase = getClient();
  const [plRes, laborRes] = await Promise.all([
    supabase.from('monthly_pl').select('*').eq('year', year).order('month'),
    supabase.from('monthly_labor').select('*').eq('year', year).order('month'),
  ]);
  if (plRes.error) throw plRes.error;
  if (laborRes.error) throw laborRes.error;
  return {
    plRows: (plRes.data ?? []) as Record<string, number>[],
    laborRows: (laborRes.data ?? []) as Record<string, number>[],
  };
}

// ── 업계동향 ─────────────────────────────────────────────────

export async function saveIndustryNews(
  year: number,
  month: number,
  items: { company: string; headline: string; content: string; source: string; seq: number }[]
) {
  const supabase = getClient();
  // 기존 데이터 삭제 후 재삽입
  await supabase.from('industry_news').delete().eq('year', year).eq('month', month);
  if (items.length > 0) {
    const rows = items.map((item) => ({ year, month, ...item }));
    const { error } = await supabase.from('industry_news').insert(rows);
    if (error) throw error;
  }
}

export async function loadIndustryNews(year: number, month: number) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('industry_news')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('company')
    .order('seq');
  if (error) throw error;
  return data ?? [];
}

// ── 시장점유율 ───────────────────────────────────────────────

export async function saveMarketShare(
  year: number,
  month: number,
  items: { company: string; share_pct: number }[]
) {
  const supabase = getClient();
  const rows = items.map((item) => ({ year, month, ...item }));
  const { error } = await supabase
    .from('monthly_market_share')
    .upsert(rows, { onConflict: 'year,month,company' });
  if (error) throw error;
}

export async function loadMarketShare(year: number, month: number) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_market_share')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('company');
  if (error) throw error;
  return data ?? [];
}

// ── TOP10 모델 ───────────────────────────────────────────────

export async function saveTopModels(
  year: number,
  month: number,
  items: { rank: number; model_name: string; company: string; sales_qty: number }[]
) {
  const supabase = getClient();
  const rows = items.map((item) => ({ year, month, ...item }));
  const { error } = await supabase
    .from('monthly_top_models')
    .upsert(rows, { onConflict: 'year,month,rank' });
  if (error) throw error;
}

export async function loadTopModels(year: number, month: number) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_top_models')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('rank');
  if (error) throw error;
  return data ?? [];
}

// ── 사업계획 ─────────────────────────────────────────────────

export async function saveAnnualPlan(
  year: number,
  month: number,
  items: { item_code: string; item_name: string; value: number }[]
) {
  const supabase = getClient();
  const rows = items.map((item) => ({ year, month, ...item }));
  const { error } = await supabase
    .from('annual_plan')
    .upsert(rows, { onConflict: 'year,month,item_code' });
  if (error) throw error;
}

export async function loadAnnualPlan(year: number, month?: number) {
  const supabase = getClient();
  let query = supabase.from('annual_plan').select('*').eq('year', year);
  if (month != null) query = query.eq('month', month);
  const { data, error } = await query.order('month').order('item_code');
  if (error) throw error;
  return data ?? [];
}

export async function loadAnnualPlanAsDict(year: number, month: number): Promise<Record<string, number>> {
  const rows = await loadAnnualPlan(year, month);
  const dict: Record<string, number> = {};
  for (const r of rows) {
    dict[r.item_code] = r.value;
  }
  return dict;
}

// ── 회계팀 자료 ──────────────────────────────────────────────

export async function saveMonthlyAcct(
  year: number,
  month: number,
  items: { item_code: string; item_name: string; value: number }[]
) {
  const supabase = getClient();
  const rows = items.map((item) => ({ year, month, ...item }));
  const { error } = await supabase
    .from('monthly_acct')
    .upsert(rows, { onConflict: 'year,month,item_code' });
  if (error) throw error;
}

export async function loadMonthlyAcct(year: number, month: number): Promise<Record<string, number>> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_acct')
    .select('item_code, value')
    .eq('year', year)
    .eq('month', month);
  if (error) throw error;
  const dict: Record<string, number> = {};
  for (const r of (data ?? [])) {
    dict[r.item_code] = r.value;
  }
  return dict;
}

// ── 운영실적 ─────────────────────────────────────────────────

export async function saveMonthlyOperations(
  year: number,
  month: number,
  sections: { section: string; section_name: string; content: string }[]
) {
  const supabase = getClient();
  const rows = sections.map((s) => ({ year, month, ...s }));
  const { error } = await supabase
    .from('monthly_operations')
    .upsert(rows, { onConflict: 'year,month,section' });
  if (error) throw error;
}

export async function loadMonthlyOperations(year: number, month: number) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('monthly_operations')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('section');
  if (error) throw error;
  return data ?? [];
}
