-- ============================================================
-- 진양오토모티브 월차보고 시스템 — Supabase PostgreSQL 스키마
-- SQLite → PostgreSQL 마이그레이션
-- ============================================================

-- 1. 사업계획 (연 1회 입력, 월별×항목)
CREATE TABLE IF NOT EXISTS annual_plan (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    item_code   TEXT NOT NULL,
    item_name   TEXT NOT NULL,
    value       DOUBLE PRECISION DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month, item_code)
);

-- 2. 손익 실적 (매월 입력, 공장별 4개)
CREATE TABLE IF NOT EXISTS monthly_pl (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,

    -- 판매수량 (대)
    qty_gimhae      DOUBLE PRECISION DEFAULT 0,
    qty_busan       DOUBLE PRECISION DEFAULT 0,
    qty_ulsan       DOUBLE PRECISION DEFAULT 0,
    qty_gimhae2     DOUBLE PRECISION DEFAULT 0,

    -- 생산금액 (천원)
    prod_gimhae     DOUBLE PRECISION DEFAULT 0,
    prod_busan      DOUBLE PRECISION DEFAULT 0,
    prod_ulsan      DOUBLE PRECISION DEFAULT 0,
    prod_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 매출액 - 생산품 (천원)
    sales_prod_gimhae   DOUBLE PRECISION DEFAULT 0,
    sales_prod_busan    DOUBLE PRECISION DEFAULT 0,
    sales_prod_ulsan    DOUBLE PRECISION DEFAULT 0,
    sales_prod_gimhae2  DOUBLE PRECISION DEFAULT 0,

    -- 매출액 - 외주품 (천원)
    sales_out_gimhae    DOUBLE PRECISION DEFAULT 0,
    sales_out_busan     DOUBLE PRECISION DEFAULT 0,
    sales_out_ulsan     DOUBLE PRECISION DEFAULT 0,
    sales_out_gimhae2   DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 재고증감차 (천원)
    inv_diff_gimhae     DOUBLE PRECISION DEFAULT 0,
    inv_diff_busan      DOUBLE PRECISION DEFAULT 0,
    inv_diff_ulsan      DOUBLE PRECISION DEFAULT 0,
    inv_diff_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 재료비 (천원)
    material_gimhae     DOUBLE PRECISION DEFAULT 0,
    material_busan      DOUBLE PRECISION DEFAULT 0,
    material_ulsan      DOUBLE PRECISION DEFAULT 0,
    material_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 복리후생비
    mfg_welfare_gimhae  DOUBLE PRECISION DEFAULT 0,
    mfg_welfare_busan   DOUBLE PRECISION DEFAULT 0,
    mfg_welfare_ulsan   DOUBLE PRECISION DEFAULT 0,
    mfg_welfare_gimhae2 DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 전력비
    mfg_power_gimhae    DOUBLE PRECISION DEFAULT 0,
    mfg_power_busan     DOUBLE PRECISION DEFAULT 0,
    mfg_power_ulsan     DOUBLE PRECISION DEFAULT 0,
    mfg_power_gimhae2   DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 운반비
    mfg_trans_gimhae    DOUBLE PRECISION DEFAULT 0,
    mfg_trans_busan     DOUBLE PRECISION DEFAULT 0,
    mfg_trans_ulsan     DOUBLE PRECISION DEFAULT 0,
    mfg_trans_gimhae2   DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 수선비
    mfg_repair_gimhae   DOUBLE PRECISION DEFAULT 0,
    mfg_repair_busan    DOUBLE PRECISION DEFAULT 0,
    mfg_repair_ulsan    DOUBLE PRECISION DEFAULT 0,
    mfg_repair_gimhae2  DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 소모품비
    mfg_supplies_gimhae  DOUBLE PRECISION DEFAULT 0,
    mfg_supplies_busan   DOUBLE PRECISION DEFAULT 0,
    mfg_supplies_ulsan   DOUBLE PRECISION DEFAULT 0,
    mfg_supplies_gimhae2 DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 지급수수료
    mfg_fee_gimhae      DOUBLE PRECISION DEFAULT 0,
    mfg_fee_busan       DOUBLE PRECISION DEFAULT 0,
    mfg_fee_ulsan       DOUBLE PRECISION DEFAULT 0,
    mfg_fee_gimhae2     DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 제조경비 - 기타
    mfg_other_gimhae    DOUBLE PRECISION DEFAULT 0,
    mfg_other_busan     DOUBLE PRECISION DEFAULT 0,
    mfg_other_ulsan     DOUBLE PRECISION DEFAULT 0,
    mfg_other_gimhae2   DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 수도광열비
    mfg_water_gimhae    DOUBLE PRECISION DEFAULT 0,
    mfg_water_busan     DOUBLE PRECISION DEFAULT 0,
    mfg_water_ulsan     DOUBLE PRECISION DEFAULT 0,
    mfg_water_gimhae2   DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 보험료
    mfg_insurance_gimhae  DOUBLE PRECISION DEFAULT 0,
    mfg_insurance_busan   DOUBLE PRECISION DEFAULT 0,
    mfg_insurance_ulsan   DOUBLE PRECISION DEFAULT 0,
    mfg_insurance_gimhae2 DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 판매운반비
    selling_trans_gimhae    DOUBLE PRECISION DEFAULT 0,
    selling_trans_busan     DOUBLE PRECISION DEFAULT 0,
    selling_trans_ulsan     DOUBLE PRECISION DEFAULT 0,
    selling_trans_gimhae2   DOUBLE PRECISION DEFAULT 0,

    -- 변동비: 상품매입
    merch_purchase_gimhae   DOUBLE PRECISION DEFAULT 0,
    merch_purchase_busan    DOUBLE PRECISION DEFAULT 0,
    merch_purchase_ulsan    DOUBLE PRECISION DEFAULT 0,
    merch_purchase_gimhae2  DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 노무비 - 급료
    labor_salary_gimhae     DOUBLE PRECISION DEFAULT 0,
    labor_salary_busan      DOUBLE PRECISION DEFAULT 0,
    labor_salary_ulsan      DOUBLE PRECISION DEFAULT 0,
    labor_salary_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 노무비 - 임금
    labor_wage_gimhae       DOUBLE PRECISION DEFAULT 0,
    labor_wage_busan        DOUBLE PRECISION DEFAULT 0,
    labor_wage_ulsan        DOUBLE PRECISION DEFAULT 0,
    labor_wage_gimhae2      DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 노무비 - 상여금
    labor_bonus_gimhae      DOUBLE PRECISION DEFAULT 0,
    labor_bonus_busan       DOUBLE PRECISION DEFAULT 0,
    labor_bonus_ulsan       DOUBLE PRECISION DEFAULT 0,
    labor_bonus_gimhae2     DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 노무비 - 퇴충전입액
    labor_retire_gimhae     DOUBLE PRECISION DEFAULT 0,
    labor_retire_busan      DOUBLE PRECISION DEFAULT 0,
    labor_retire_ulsan      DOUBLE PRECISION DEFAULT 0,
    labor_retire_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 노무비 - 외주용역비
    labor_outsrc_gimhae     DOUBLE PRECISION DEFAULT 0,
    labor_outsrc_busan      DOUBLE PRECISION DEFAULT 0,
    labor_outsrc_ulsan      DOUBLE PRECISION DEFAULT 0,
    labor_outsrc_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 인건비 - 급료
    staff_salary_gimhae     DOUBLE PRECISION DEFAULT 0,
    staff_salary_busan      DOUBLE PRECISION DEFAULT 0,
    staff_salary_ulsan      DOUBLE PRECISION DEFAULT 0,
    staff_salary_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 인건비 - 상여금
    staff_bonus_gimhae      DOUBLE PRECISION DEFAULT 0,
    staff_bonus_busan       DOUBLE PRECISION DEFAULT 0,
    staff_bonus_ulsan       DOUBLE PRECISION DEFAULT 0,
    staff_bonus_gimhae2     DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 인건비 - 퇴충전입액
    staff_retire_gimhae     DOUBLE PRECISION DEFAULT 0,
    staff_retire_busan      DOUBLE PRECISION DEFAULT 0,
    staff_retire_ulsan      DOUBLE PRECISION DEFAULT 0,
    staff_retire_gimhae2    DOUBLE PRECISION DEFAULT 0,

    -- 고정비: 제조경비
    fix_depr_gimhae         DOUBLE PRECISION DEFAULT 0,
    fix_depr_busan          DOUBLE PRECISION DEFAULT 0,
    fix_depr_ulsan          DOUBLE PRECISION DEFAULT 0,
    fix_depr_gimhae2        DOUBLE PRECISION DEFAULT 0,

    fix_lease_gimhae        DOUBLE PRECISION DEFAULT 0,
    fix_lease_busan         DOUBLE PRECISION DEFAULT 0,
    fix_lease_ulsan         DOUBLE PRECISION DEFAULT 0,
    fix_lease_gimhae2       DOUBLE PRECISION DEFAULT 0,

    fix_outsrc_gimhae       DOUBLE PRECISION DEFAULT 0,
    fix_outsrc_busan        DOUBLE PRECISION DEFAULT 0,
    fix_outsrc_ulsan        DOUBLE PRECISION DEFAULT 0,
    fix_outsrc_gimhae2      DOUBLE PRECISION DEFAULT 0,

    fix_other_gimhae        DOUBLE PRECISION DEFAULT 0,
    fix_other_busan         DOUBLE PRECISION DEFAULT 0,
    fix_other_ulsan         DOUBLE PRECISION DEFAULT 0,
    fix_other_gimhae2       DOUBLE PRECISION DEFAULT 0,

    -- 영업외
    non_op_income           DOUBLE PRECISION DEFAULT 0,
    non_op_expense          DOUBLE PRECISION DEFAULT 0,
    interest_income         DOUBLE PRECISION DEFAULT 0,
    interest_expense        DOUBLE PRECISION DEFAULT 0,

    updated_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month)
);

-- 3. 인원 및 근무시간 (매월 입력)
CREATE TABLE IF NOT EXISTS monthly_labor (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,

    -- 인원 (명)
    mgmt_rkm            DOUBLE PRECISION DEFAULT 0,
    mgmt_hkmc           DOUBLE PRECISION DEFAULT 0,
    prod_rkm            DOUBLE PRECISION DEFAULT 0,
    prod_hkmc           DOUBLE PRECISION DEFAULT 0,

    -- 입퇴사
    hire_count          INTEGER DEFAULT 0,
    resign_count        INTEGER DEFAULT 0,

    -- 근무시간 (시간)
    work_hours_rkm      DOUBLE PRECISION DEFAULT 0,
    work_hours_hkmc     DOUBLE PRECISION DEFAULT 0,
    overtime_gimhae     DOUBLE PRECISION DEFAULT 0,
    overtime_busan      DOUBLE PRECISION DEFAULT 0,
    base_hours_gimhae   DOUBLE PRECISION DEFAULT 0,
    base_hours_busan    DOUBLE PRECISION DEFAULT 0,

    -- 상여금 (천원)
    bonus_prod_rkm      DOUBLE PRECISION DEFAULT 0,
    bonus_prod_hkmc     DOUBLE PRECISION DEFAULT 0,

    -- 퇴직급여 (천원)
    retire_mgmt_rkm     DOUBLE PRECISION DEFAULT 0,
    retire_mgmt_hkmc    DOUBLE PRECISION DEFAULT 0,
    retire_prod_rkm     DOUBLE PRECISION DEFAULT 0,
    retire_prod_hkmc    DOUBLE PRECISION DEFAULT 0,

    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month)
);

-- 4. 업계동향 (매월 수시 입력)
CREATE TABLE IF NOT EXISTS industry_news (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    company     TEXT NOT NULL,
    headline    TEXT NOT NULL,
    content     TEXT,
    source      TEXT,
    seq         INTEGER DEFAULT 1,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. 시장점유율 (매월 입력)
CREATE TABLE IF NOT EXISTS monthly_market_share (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    company     TEXT NOT NULL,
    share_pct   DOUBLE PRECISION DEFAULT 0,
    UNIQUE(year, month, company)
);

-- 6. TOP10 판매 모델 (매월 입력)
CREATE TABLE IF NOT EXISTS monthly_top_models (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    rank        INTEGER NOT NULL,
    model_name  TEXT NOT NULL,
    company     TEXT NOT NULL,
    sales_qty   INTEGER DEFAULT 0,
    UNIQUE(year, month, rank)
);

-- 7. 회계팀 자료
CREATE TABLE IF NOT EXISTS monthly_acct (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year        INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    item_code   TEXT NOT NULL,
    item_name   TEXT NOT NULL,
    value       DOUBLE PRECISION DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month, item_code)
);

-- 8. 운영실적 (서술형)
CREATE TABLE IF NOT EXISTS monthly_operations (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,
    section         TEXT NOT NULL,
    section_name    TEXT NOT NULL,
    content         TEXT DEFAULT '',
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month, section)
);

-- ── 인덱스 ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annual_plan_ym ON annual_plan(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_pl_ym ON monthly_pl(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_labor_ym ON monthly_labor(year, month);
CREATE INDEX IF NOT EXISTS idx_industry_news_ym ON industry_news(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_ops_ym ON monthly_operations(year, month);

-- ── RLS 비활성화 (1인 사용, 인증 불필요) ──────────────────────
ALTER TABLE annual_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_pl ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_market_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_top_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_acct ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_operations ENABLE ROW LEVEL SECURITY;

-- anon 키로 전체 접근 허용 (1인 내부 시스템)
CREATE POLICY "Allow all for anon" ON annual_plan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_pl FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_labor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON industry_news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_market_share FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_top_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_acct FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON monthly_operations FOR ALL USING (true) WITH CHECK (true);
