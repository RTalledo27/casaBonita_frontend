export function parseApiDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return new Date(String(value ?? ''));

  const trimmed = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  return new Date(trimmed);
}

export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function diffCalendarDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const aa = startOfLocalDay(a).getTime();
  const bb = startOfLocalDay(b).getTime();
  return Math.round((aa - bb) / msPerDay);
}

