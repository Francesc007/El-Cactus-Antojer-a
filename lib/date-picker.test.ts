import { describe, expect, it } from "vitest";
import { buildCalendarDays, formatPickerDate, isDateInRange } from "@/lib/date-picker";

describe("date-picker", () => {
  it("formatea fechas en español", () => {
    expect(formatPickerDate("2026-09-19")).toMatch(/Septiembre/i);
    expect(formatPickerDate("2026-09-19")).toMatch(/2026/);
  });

  it("respeta min y max", () => {
    expect(isDateInRange("2026-09-18", "2026-09-19")).toBe(false);
    expect(isDateInRange("2026-09-20", "2026-09-19", "2026-09-25")).toBe(true);
  });

  it("marca el día seleccionado en el calendario", () => {
    const days = buildCalendarDays(2026, 8, "2026-09-19");
    const selected = days.find((day) => day.dateStr === "2026-09-19");
    expect(selected?.isSelected).toBe(true);
    expect(selected?.inMonth).toBe(true);
  });
});
