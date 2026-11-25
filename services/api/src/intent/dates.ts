// Pure date helpers for the intent parser. Dates are YYYY-MM-DD (IST calendar days).

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Next date after refDate (strictly later) that falls on weekday wd. */
export function nextWeekday(refDate: string, wd: number): string {
  const diff = (wd - weekdayOf(refDate) + 7) % 7 || 7;
  return addDays(refDate, diff);
}

/** The date with weekday wd inside [from, to], or null. */
export function weekdayInWindow(from: string, to: string, wd: number): string | null {
  for (let d = from; d <= to; d = addDays(d, 1)) if (weekdayOf(d) === wd) return d;
  return null;
}

/** Day-of-month n on or after refDate (same month if n >= ref day, else next month). */
export function dayOfMonth(refDate: string, n: number): string {
  const [y, m, d] = refDate.split('-').map(Number);
  const month = n >= d ? m : m + 1;
  const dt = new Date(Date.UTC(y, month - 1, n));
  return dt.toISOString().slice(0, 10);
}
