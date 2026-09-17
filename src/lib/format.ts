/**
 * Shared formatters.
 *
 * Dates are rendered in UTC, deliberately. The CMS collects date-ONLY values
 * ("2026-09-19"), which parse to UTC midnight — formatting those in a local
 * zone renders the previous day for anyone west of Greenwich, including the
 * build machine. UTC is the only zone that round-trips a date-only value
 * unchanged, so a tournament can't drift a day between the CMS and the page.
 */
const TZ = 'UTC';

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts });

export const dayOfWeek = (d: Date) => fmt({ weekday: 'short' }).format(d).toUpperCase();
export const monthDay = (d: Date) => fmt({ month: 'short', day: 'numeric' }).format(d).toUpperCase();
export const monthShort = (d: Date) => fmt({ month: 'short' }).format(d).toUpperCase();
export const dayNum = (d: Date) => fmt({ day: 'numeric' }).format(d);
export const fullDate = (d: Date) =>
  fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);

/** "Sep 20–21, 2026" for multi-day tournaments, "Sep 20, 2026" otherwise. */
export function dateRange(start: Date, end?: Date) {
  if (!end || start.getTime() === end.getTime()) {
    return fmt({ month: 'short', day: 'numeric', year: 'numeric' }).format(start);
  }
  // Intl has no "day + year" pattern — asking for one yields "2026 (day: 19)".
  // Build the same-month tail by hand instead.
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const left = fmt({ month: 'short', day: 'numeric' }).format(start);
  const right = sameMonth
    ? `${fmt({ day: 'numeric' }).format(end)}, ${fmt({ year: 'numeric' }).format(end)}`
    : fmt({ month: 'short', day: 'numeric', year: 'numeric' }).format(end);
  return `${left}–${right}`;
}

/** Machine-readable date for <time datetime> and JSON-LD. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const money = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

/** ".812" — a baseball-style rate, leading zero dropped, as in the mockup. */
export const rate = (value: number) =>
  value >= 1 ? value.toFixed(3) : value.toFixed(3).replace(/^0/, '');

/** Two-digit jersey/countdown padding. */
export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};
