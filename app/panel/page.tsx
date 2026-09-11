"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useReservations } from "@/context/ReservationContext";
import { getPeakHour } from "@/lib/availability";
import { formatDisplayDate, todayStr } from "@/lib/dates";
import { StatusBadge } from "@/components/panel/StatusBadge";

export default function PanelDashboardPage() {
  const { reservations, getReservationsForDate, capacityConfig } =
    useReservations();
  const today = todayStr();
  const todayReservations = getReservationsForDate(today);

  const activeToday = todayReservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show"
  );

  const peak = useMemo(
    () => getPeakHour(reservations, today, capacityConfig),
    [reservations, today, capacityConfig]
  );

  const totalGuests = activeToday.reduce((sum, r) => sum + r.partySize, 0);

  return (
    <div>
      <p className="section-eyebrow">Panel</p>
      <h1 className="section-title mt-1">Resumen del día</h1>
      <p className="mt-1 text-stone-600" suppressHydrationWarning>
        {formatDisplayDate(today, { includeYear: true })}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="premium-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Reservas hoy
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-cactus-forest">
            {activeToday.length}
          </p>
        </div>
        <div className="premium-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Comensales esperados
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-cactus-sunset">
            {totalGuests}
          </p>
        </div>
        <div className="premium-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Hora pico
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-cactus-charcoal">
            {peak ? peak.time : "—"}
          </p>
          {peak && (
            <p className="mt-1 text-sm text-stone-500">
              {peak.occupancy} / {capacityConfig.totalCapacity} personas
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-cactus-charcoal">
            Próximas reservas
          </h2>
          <Link
            href="/panel/reservas"
            className="text-sm font-semibold text-cactus-forest transition hover:text-cactus-sunset"
          >
            Ver agenda →
          </Link>
        </div>

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
