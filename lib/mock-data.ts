import { isOpenDay } from "./availability";
import { getUpcomingOpenDates, todayStr } from "./dates";
import type { CapacityConfig, Reservation } from "./types";

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  totalCapacity: 50,
  defaultDurationMinutes: 90,
};

export function getInitialReservations(): Reservation[] {
  const today = todayStr();
  const openDates = getUpcomingOpenDates(2, isOpenDay);
  const [dayOne, dayTwo] = openDates.length >= 2 ? openDates : [today, today];
  const now = `${today}T12:00:00.000Z`;

  return [
    {
      id: "res-001",
      customerName: "María González",
      phone: "5512345678",
      partySize: 4,
      date: dayOne,
      time: "16:00",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
    {
      id: "res-002",
      customerName: "Carlos Ruiz",
      phone: "5587654321",
      partySize: 6,
      date: dayOne,
      time: "16:30",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
    {
      id: "res-003",
      customerName: "Ana Martínez",
      phone: "5598765432",
      partySize: 2,
      date: dayOne,
      time: "17:00",
      durationMinutes: 90,
      status: "pending",
      createdAt: now,
    },
    {
      id: "res-004",
      customerName: "Roberto Sánchez",
      phone: "5511223344",
      partySize: 8,
      date: dayOne,
      time: "18:00",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
    {
      id: "res-005",
      customerName: "Laura Hernández",
      phone: "5544332211",
      partySize: 3,
      date: dayOne,
      time: "19:00",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
    {
      id: "res-006",
      customerName: "Diego Torres",
      phone: "5566778899",
      partySize: 10,
      date: dayOne,
      time: "20:00",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
    {
      id: "res-007",
      customerName: "Patricia López",
      phone: "5533445566",
      partySize: 5,
      date: dayOne,
      time: "20:30",
      durationMinutes: 90,
      status: "pending",
      createdAt: now,
    },
    {
      id: "res-008",
      customerName: "Fernando Díaz",
      phone: "5577889900",
      partySize: 4,
      date: dayTwo,
      time: "14:00",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
    {
      id: "res-009",
      customerName: "Sofía Ramírez",
      phone: "5599001122",
      partySize: 2,
      date: dayTwo,
      time: "17:30",
      durationMinutes: 90,
      status: "pending",
      createdAt: now,
    },
    {
      id: "res-010",
      customerName: "Jorge Mendoza",
      phone: "5511009988",
      partySize: 6,
      date: dayTwo,
      time: "20:00",
      durationMinutes: 90,
      status: "confirmed",
      createdAt: now,
    },
  ];
}
