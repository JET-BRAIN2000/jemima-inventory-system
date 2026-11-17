/**
 * Formats a number as a real-world currency string.
 *
 * Examples (with symbol "$"):
 *   0          → "$0.00"
 *   7.5        → "$7.50"
 *   1234.5     → "$1,234.50"
 *   1234567.89 → "$1,234,567.89"
 *
 * Always shows exactly two decimal places and uses locale-aware
 * thousand separators.
 */
export function formatCurrency(value: number, currencySymbol: string): string {
  return `${currencySymbol}${value.toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Compact formatter for chart Y-axis labels.
 *
 * Displays values in a human-readable abbreviated form:
 *   0          → "$0"
 *   500        → "$500"
 *   1_500      → "$1.5k"
 *   25_000     → "$25k"
 *   1_200_000  → "$1.2M"
 */
export function formatCurrencyCompact(value: number, currencySymbol: string): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}${currencySymbol}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}${currencySymbol}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${sign}${currencySymbol}${abs.toFixed(0)}`;
}
