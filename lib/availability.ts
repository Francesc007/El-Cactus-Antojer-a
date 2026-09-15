import { OPERATING_HOURS } from "./business-info";
import { getDayOfWeek } from "./dates";
import type {
  BlockedSlot,
  CapacityConfig,
  OperatingHour,
  Reservation,
} from "./types";

export const ACTIVE_RESERVATION_STATUSES: Reservation["status"][] = [
  "pending",
  "confirmed",
  "completed",
];

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function isOpenDay(
  dateStr: string,
  hours: readonly OperatingHour[] | typeof OPERATING_HOURS = OPERATING_HOURS
): boolean {
  const day = getDayOfWeek(dateStr);
  const match = hours.find((entry) => {
    if ("days" in entry) {
      return (entry.days as readonly number[]).includes(day);
    }
    return entry.dayOfWeek === day;
  });

  if (!match) return false;
  if ("isClosed" in match) return !match.isClosed;
  return true;
}

export function getHoursForDate(
  dateStr: string,
  hours: readonly OperatingHour[] | typeof OPERATING_HOURS = OPERATING_HOURS
): { open: string; close: string } | null {
  const day = getDayOfWeek(dateStr);
  const schedule = hours.find((entry) => {
    if ("days" in entry) {
      return (entry.days as readonly number[]).includes(day);
    }
    return entry.dayOfWeek === day && !entry.isClosed;
  });

  if (!schedule) return null;
  if ("isClosed" in schedule && schedule.isClosed) return null;

  if ("open" in schedule) {
    return { open: schedule.open, close: schedule.close };
  }

  return { open: schedule.openTime, close: schedule.closeTime };
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
    .filter((r) => r.date === date && ACTIVE_RESERVATION_STATUSES.includes(r.status))
    .filter((r) => {
      const resStart = timeToMinutes(r.time);
      const resEnd = resStart + r.durationMinutes;
      return rangesOverlap(slotStart, slotEnd, resStart, resEnd);
    })
    .reduce((sum, r) => sum + r.partySize, 0);
}

export function slotOverlapsBlocked(
  date: string,
  slotTime: string,
  durationMinutes: number,
  blockedSlots: BlockedSlot[]
): boolean {
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + durationMinutes;

  return blockedSlots.some((slot) => {
    if (slot.date !== date) return false;
    return rangesOverlap(
      slotStart,
      slotEnd,
      timeToMinutes(slot.startTime),
      timeToMinutes(slot.endTime)
    );
  });
}

export function isSlotAvailable(
  reservations: Reservation[],
  config: CapacityConfig,
  date: string,
  slotTime: string,
  partySize: number,
  blockedSlots: BlockedSlot[] = [],
  hours: readonly OperatingHour[] | typeof OPERATING_HOURS = OPERATING_HOURS
): boolean {
  if (!isOpenDay(date, hours)) return false;
  if (slotOverlapsBlocked(date, slotTime, config.defaultDurationMinutes, blockedSlots)) {
    return false;
  }

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

export function getAllSlotsForDate(
  date: string,
  hours: readonly OperatingHour[] | typeof OPERATING_HOURS = OPERATING_HOURS
): string[] {
  const range = getHoursForDate(date, hours);
  if (!range) return [];
  return generateTimeSlots(range.open, range.close);
}

export function getOccupancyByHour(
  reservations: Reservation[],
  date: string,
  config: CapacityConfig,
  hours: readonly OperatingHour[] | typeof OPERATING_HOURS = OPERATING_HOURS
): { time: string; occupancy: number; capacity: number }[] {
  const slots = getAllSlotsForDate(date, hours);
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
  config: CapacityConfig,
  hours: readonly OperatingHour[] | typeof OPERATING_HOURS = OPERATING_HOURS
): { time: string; occupancy: number } | null {
  const byHour = getOccupancyByHour(reservations, date, config, hours);
  if (byHour.length === 0) return null;

  const peak = byHour.reduce((max, slot) =>
    slot.occupancy > max.occupancy ? slot : max
  );

  return peak.occupancy > 0
    ? { time: peak.time, occupancy: peak.occupancy }
    : null;
}
