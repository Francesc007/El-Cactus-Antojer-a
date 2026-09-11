"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CAPACITY_CONFIG,
  getInitialReservations,
} from "@/lib/mock-data";
import type {
  CapacityConfig,
  NewReservationInput,
  Reservation,
  ReservationStatus,
} from "@/lib/types";

type ReservationContextValue = {
  reservations: Reservation[];
  capacityConfig: CapacityConfig;
  addReservation: (input: NewReservationInput) => Reservation;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  getReservationsForDate: (date: string) => Reservation[];
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>(
    getInitialReservations
  );
  const [capacityConfig] = useState<CapacityConfig>(DEFAULT_CAPACITY_CONFIG);

  const addReservation = useCallback(
    (input: NewReservationInput): Reservation => {
      const newReservation: Reservation = {
        id: `res-${Date.now()}`,
        customerName: input.customerName,
        phone: input.phone,
        partySize: input.partySize,
        date: input.date,
        time: input.time,
        durationMinutes: capacityConfig.defaultDurationMinutes,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      setReservations((prev) => [...prev, newReservation]);
      return newReservation;
    },
    [capacityConfig.defaultDurationMinutes]
  );

  const updateReservationStatus = useCallback(
    (id: string, status: ReservationStatus) => {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    },
    []
  );

  const getReservationsForDate = useCallback(
    (date: string) =>
      reservations
        .filter((r) => r.date === date)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [reservations]
  );

  const value = useMemo(
    () => ({
      reservations,
      capacityConfig,
      addReservation,
      updateReservationStatus,
      getReservationsForDate,
    }),
    [
      reservations,
      capacityConfig,
      addReservation,
      updateReservationStatus,
      getReservationsForDate,
    ]
  );

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations(): ReservationContextValue {
  const ctx = useContext(ReservationContext);
  if (!ctx) {
    throw new Error("useReservations must be used within ReservationProvider");
  }
  return ctx;
}
