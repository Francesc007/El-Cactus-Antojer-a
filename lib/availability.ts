import { OPERATING_HOURS } from "./business-info";
import { getDayOfWeek } from "./dates";
import type { CapacityConfig, Reservation } from "./types";

const ACTIVE_STATUSES: Reservation["status"][] = [
  "pending",
  "confirmed",
  "completed",
];

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function isOpenDay(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return OPERATING_HOURS.some((schedule) =>
    (schedule.days as readonly number[]).includes(day)
  );
}

export function getHoursForDate(
  dateStr: string
): { open: string; close: string } | null {
  const day = getDayOfWeek(dateStr);
  const schedule = OPERATING_HOURS.find((entry) =>
    (entry.days as readonly number[]).includes(day)
  );

  return schedule ? { open: schedule.open, close: schedule.close } : null;
}

export function getProjectedOccupancy(
  reservations: Reservation[],
  date: string,
  slotTime: string,
  durationMinutes: number
): number {
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + durationMinutes;

  return reservations
    .filter(
      (r) => r.date === date && ACTIVE_STATUSES.includes(r.status)
    )
    .filter((r) => {
      const resStart = timeToMinutes(r.time);
      const resEnd = resStart + r.durationMinutes;
      return rangesOverlap(slotStart, slotEnd, resStart, resEnd);
    })
    .reduce((sum, r) => sum + r.partySize, 0);
}

export function isSlotAvailable(
  reservations: Reservation[],
  config: CapacityConfig,
  date: string,
  slotTime: string,
  partySize: number
): boolean {
  if (!isOpenDay(date)) return false;

  const occupancy = getProjectedOccupancy(
    reservations,
    date,
    slotTime,
    config.defaultDurationMinutes
  );
  return config.totalCapacity - occupancy >= partySize;
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes = 30
): string[] {
  const slots: string[] = [];
  let current = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  while (current < close) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += intervalMinutes;
  }

  return slots;
}

export function getAllSlotsForDate(date: string): string[] {
  const hours = getHoursForDate(date);
  if (!hours) return [];
  return generateTimeSlots(hours.open, hours.close);
}

export function getOccupancyByHour(
  reservations: Reservation[],
  date: string,
  config: CapacityConfig
): { time: string; occupancy: number; capacity: number }[] {
  const slots = getAllSlotsForDate(date);
  return slots.map((time) => ({
    time,
    occupancy: getProjectedOccupancy(
      reservations,
      date,
      time,
      config.defaultDurationMinutes
    ),
    capacity: config.totalCapacity,
  }));
}

export function getPeakHour(
  reservations: Reservation[],
  date: string,
  config: CapacityConfig
): { time: string; occupancy: number } | null {
  const byHour = getOccupancyByHour(reservations, date, config);
  if (byHour.length === 0) return null;

  const peak = byHour.reduce((max, slot) =>
    slot.occupancy > max.occupancy ? slot : max
  );

  return peak.occupancy > 0
    ? { time: peak.time, occupancy: peak.occupancy }
    : null;
}
