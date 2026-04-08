// ============================================================
// 상수 정의
// ============================================================

import type { FactoryCode, DivisionCode, OperationSection } from './types';

/** 공장 목록 */
export const FACTORIES: FactoryCode[] = ['gimhae', 'busan', 'ulsan', 'gimhae2'];

/** 공장 한글명 */
export const FACTORY_NAMES: Record<FactoryCode, string> = {
  gimhae: '김해공장',
  busan: '부산공장',
  ulsan: '울산공장',
  gimhae2: '김해2공장',
};

/** 사업부 → 소속 공장 */
export const DIVISIONS: Record<DivisionCode, FactoryCode[]> = {
  rkm: ['gimhae', 'busan'],
  hkmc: ['ulsan', 'gimhae2'],
};

/** 사업부 한글명 */
export const DIVISION_NAMES: Record<DivisionCode, string> = {
  rkm: 'RKM',
  hkmc: 'HKMC',
};

/** 운영실적 섹션 */
export const OPERATION_SECTIONS: { code: OperationSection; name: string }[] = [
  { code: 'summary', name: '종합 요약' },
  { code: 'sales', name: '영업·매출 실적' },
  { code: 'production', name: '생산·품질 실적' },
  { code: 'cost', name: '원가·경비 관리' },
  { code: 'hr', name: '인사·노무 현황' },
  { code: 'investment', name: '설비·투자' },
  { code: 'issues', name: '당면 과제·계획' },
];

/** 네비게이션 메뉴 */
export const NAV_ITEMS = [
  { href: '/plan', label: '사업계획', step: 1, group: '데이터 입력' },
  { href: '/industry', label: '업계동향', step: 2, group: '데이터 입력' },
  { href: '/pl', label: '손익실적', step: 3, group: '데이터 입력' },
  { href: '/labor', label: '인원·노무비', step: 4, group: '데이터 입력' },
  { href: '/dashboard', label: '대시보드', step: 5, group: '결과 조회' },
  { href: '/operations', label: '운영실적', step: 6, group: '데이터 입력' },
  { href: '/report', label: '보고서', step: 7, group: '결과 조회' },
] as const;

/** 시장점유율 회사 목록 */
export const MARKET_COMPANIES = [
  '현대',
  '기아',
  'GM',
  '르노코리아',
  'KG모빌리티',
] as const;

/** 업계동향 뉴스 검색 대상 */
export const NEWS_COMPANIES = [
  '르노코리아',
  'GM Korea',
  '현대자동차',
  '업계이슈',
] as const;
