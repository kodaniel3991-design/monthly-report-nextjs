/** 천원 단위 숫자 포맷 (예: 1,234,567) */
export function formatKRW(value: number | null | undefined): string {
  if (value == null) return '-';
  return Math.round(value).toLocaleString('ko-KR');
}

/** 퍼센트 포맷 (예: 25.82%) */
export function formatPct(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '-';
  return `${value.toFixed(decimals)}%`;
}

/** 소수점 포맷 (예: 55.7) */
export function formatDecimal(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '-';
  return value.toFixed(decimals);
}
