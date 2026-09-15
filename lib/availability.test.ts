import { describe, expect, it } from "vitest";
import {
  getAllSlotsForDate,
  isOpenDay,
  isSlotAvailable,
  slotOverlapsBlocked,
} from "@/lib/availability";
import type { BlockedSlot, Reservation } from "@/lib/types";

const config = { totalCapacity: 50, defaultDurationMinutes: 120 };

function reservation(partial: Partial<Reservation>): Reservation {
  return {
    id: "1",
    customerName: "Test",
    phone: "5512345678",
    partySize: 10,
    date: "2026-09-18",
    time: "16:00",
    durationMinutes: 120,
    status: "confirmed",
    privacyConsent: true,
    createdAt: "2026-09-18T00:00:00.000Z",
    updatedAt: "2026-09-18T00:00:00.000Z",
    ...partial,
  };
}

describe("availability", () => {
  it("cierra lunes a jueves", () => {
    expect(isOpenDay("2026-09-17")).toBe(false);
    expect(isOpenDay("2026-09-18")).toBe(true);
    expect(isOpenDay("2026-09-20")).toBe(true);
  });

  it("bloquea capacidad por solapamiento de 120 minutos", () => {
    const reservations = [reservation({ time: "16:00", partySize: 40 })];
    expect(
      isSlotAvailable(reservations, config, "2026-09-18", "16:00", 15)
    ).toBe(false);
    expect(
      isSlotAvailable(reservations, config, "2026-09-18", "17:30", 15)
    ).toBe(false);
    expect(
      isSlotAvailable(reservations, config, "2026-09-18", "18:00", 15)
    ).toBe(true);
  });

  it("marca no disponible un slot bloqueado", () => {
    const blocked: BlockedSlot[] = [
      {
        id: "b1",
        date: "2026-09-18",
        startTime: "17:00",
        endTime: "19:00",
        createdAt: "",
      },
    ];
    expect(slotOverlapsBlocked("2026-09-18", "16:30", 120, blocked)).toBe(true);
    expect(
      isSlotAvailable([], config, "2026-09-18", "17:00", 2, blocked)
    ).toBe(false);
  });

  it("genera slots de viernes", () => {
    const slots = getAllSlotsForDate("2026-09-18");
    expect(slots[0]).toBe("16:00");
    expect(slots.at(-1)).toBe("21:30");
  });
});
