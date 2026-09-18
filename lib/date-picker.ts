import { formatLocalDate, parseDateStr, todayStr } from "@/lib/dates";

export const WEEKDAY_LABELS_ES = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;

export const MONTH_LABELS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export type CalendarDay = {
  dateStr: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  disabled: boolean;
};

export function capitalizeSpanish(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPickerDate(dateStr: string): string {
  const date = parseDateStr(dateStr);
  const formatted = date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return capitalizeSpanish(formatted);
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return capitalizeSpanish(`${MONTH_LABELS_ES[monthIndex]} ${year}`);
}

export function isDateInRange(
  dateStr: string,
  min?: string,
  max?: string
): boolean {
  if (min && dateStr < min) return false;
  if (max && dateStr > max) return false;
  return true;
}

export function buildCalendarDays(
  year: number,
  monthIndex: number,
  selectedDate: string,
  min?: string,
  max?: string
): CalendarDay[] {
  const today = todayStr();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const dateStr = formatLocalDate(cellDate);

    return {
      dateStr,
      day: cellDate.getDate(),
      inMonth: cellDate.getMonth() === monthIndex,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
      disabled: !isDateInRange(dateStr, min, max),
    };
  });
}

export function monthFromDateStr(dateStr: string): { year: number; monthIndex: number } {
  const date = dateStr ? parseDateStr(dateStr) : parseDateStr(todayStr());
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number
): { year: number; monthIndex: number } {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}
