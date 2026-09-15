"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createContext, useContext } from "react";
import { apiRequest } from "@/lib/api-client";
import { todayStr } from "@/lib/dates";
import type { Reservation, ReservationStatus } from "@/lib/types";

type ReservationContextValue = {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  refresh: () => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  getReservationsForDate: (date: string) => Reservation[];
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ reservations: Reservation[] }>(
        `/api/reservations?date=${selectedDate}`
      );
      setReservations(data.reservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateReservationStatus = useCallback(
    async (id: string, status: ReservationStatus) => {
      const data = await apiRequest<{ reservation: Reservation }>(
        `/api/reservations/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
      setReservations((prev) =>
        prev.map((item) => (item.id === id ? data.reservation : item))
      );
    },
    []
  );

  const getReservationsForDate = useCallback(
    (date: string) =>
      reservations
        .filter((item) => item.date === date)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [reservations]
  );

  const value = useMemo(
    () => ({
      reservations,
      loading,
      error,
      selectedDate,
      setSelectedDate,
      refresh,
      updateReservationStatus,
      getReservationsForDate,
    }),
    [
      reservations,
      loading,
      error,
      selectedDate,
      refresh,
      updateReservationStatus,
      getReservationsForDate,
    ]
  );

  return (
    <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>
  );
}

export function useReservations(): ReservationContextValue {
  const ctx = useContext(ReservationContext);
  if (!ctx) {
    throw new Error("useReservations must be used within ReservationProvider");
  }
  return ctx;
}
