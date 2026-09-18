/** Fecha local en formato YYYY-MM-DD (sin depender de UTC/toISOString). */
export function todayStr(): string {
  return formatLocalDate(new Date());
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function maxDateStr(daysAhead = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatLocalDate(d);
}

export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getDayOfWeek(dateStr: string): number {
  return parseDateStr(dateStr).getDay();
}

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function getUpcomingOpenDates(
  count: number,
  isOpenDay: (dateStr: string) => boolean
): string[] {
  const result: string[] = [];
  const start = todayStr();

  for (let i = 0; result.length < count && i < 21; i++) {
    const dateStr = addDaysStr(start, i);
    if (isOpenDay(dateStr)) {
      result.push(dateStr);
    }
  }

  return result;
}

export function formatDisplayDate(
  dateStr: string,
  options?: { includeYear?: boolean }
): string {
  const formatted = parseDateStr(dateStr).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(options?.includeYear ? { year: "numeric" } : {}),
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
