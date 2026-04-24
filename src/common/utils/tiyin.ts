/**
 * Convert KZT to tiyin (1 KZT = 100 tiyin).
 */
export function kztToTiyin(kzt: number): number {
  return Math.round(kzt * 100);
}

/**
 * Convert tiyin to KZT.
 */
export function tiyinToKzt(tiyin: number): number {
  return tiyin / 100;
}

/**
 * Format tiyin as KZT string (e.g., "1 250 ₸").
 */
export function formatTiyin(tiyin: number): string {
  const kzt = tiyin / 100;
  return `${kzt.toLocaleString('ru-RU')} ₸`;
}
