"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useReservations } from "@/context/ReservationContext";
import { apiRequest } from "@/lib/api-client";
import { getPeakHour } from "@/lib/availability";
import { formatDisplayDate, todayStr } from "@/lib/dates";
import { DEFAULT_CAPACITY_CONFIG } from "@/lib/mock-data";
import { PanelStatCard } from "@/components/panel/PanelStatCard";
import { StatusBadge } from "@/components/panel/StatusBadge";
import type { CapacityConfig } from "@/lib/types";

export default function PanelDashboardPage() {
  const { reservations, getReservationsForDate, loading, error, setSelectedDate } =
    useReservations();
  const today = todayStr();
  const [capacity, setCapacity] = useState<CapacityConfig>(DEFAULT_CAPACITY_CONFIG);

  const loadSettings = useCallback(async () => {
    const data = await apiRequest<{ capacity: CapacityConfig }>("/api/settings");
    setCapacity(data.capacity);
  }, []);

  useEffect(() => {
    setSelectedDate(today);
  }, [setSelectedDate, today]);

  useEffect(() => {
    void loadSettings().catch(() => undefined);
  }, [loadSettings]);

  const todayReservations = getReservationsForDate(today);

  const activeToday = todayReservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show"
  );

  const peak = useMemo(
    () => getPeakHour(reservations, today, capacity),
    [reservations, today, capacity]
  );

  const totalGuests = activeToday.reduce((sum, r) => sum + r.partySize, 0);

  if (loading) {
    return <p className="text-stone-500">Cargando resumen…</p>;
  }

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }

  return (
    <div>
      <p className="section-eyebrow">Panel</p>
      <h1 className="section-title mt-1">Resumen del día</h1>
      <p className="mt-1 text-stone-600" suppressHydrationWarning>
        {formatDisplayDate(today, { includeYear: true })}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <PanelStatCard
          label="Reservas hoy"
          tone="forest"
          value={<span className="text-cactus-forest">{activeToday.length}</span>}
        />
        <PanelStatCard
          label="Comensales esperados"
          tone="sunset"
          value={<span className="text-cactus-sunset">{totalGuests}</span>}
        />
        <PanelStatCard
          label="Hora pico"
          tone="lime"
          value={<span className="text-cactus-charcoal">{peak ? peak.time : "—"}</span>}
        >
          {peak && (
            <p className="mt-1 text-sm text-stone-600">
              {peak.occupancy} / {capacity.totalCapacity} personas
            </p>
          )}
        </PanelStatCard>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-bold text-cactus-charcoal">
          Próximas reservas
        </h2>

        <div className="premium-card mt-4 overflow-hidden">
          {todayReservations.length === 0 ? (
            <p className="p-6 text-stone-500">No hay reservas para hoy.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-stone-600">Hora</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Pers.</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {todayReservations.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold">{r.time}</td>
                    <td className="px-4 py-3">{r.customerName}</td>
                    <td className="px-4 py-3">{r.partySize}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
