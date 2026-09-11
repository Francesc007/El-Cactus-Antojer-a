"use client";

import { useState } from "react";
import { useReservations } from "@/context/ReservationContext";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { todayStr } from "@/lib/dates";
import type { ReservationStatus } from "@/lib/types";

export default function PanelReservasPage() {
  const { getReservationsForDate, updateReservationStatus } = useReservations();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  const dayReservations = getReservationsForDate(selectedDate);

  function handleStatusChange(id: string, status: ReservationStatus) {
    updateReservationStatus(id, status);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Operación</p>
          <h1 className="section-title mt-1">Agenda de reservas</h1>
          <p className="mt-1 text-stone-600">
            Gestiona llegadas, cancelaciones y no-shows del día.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBlockModalOpen(true)}
          className="rounded-xl border border-cactus-sand bg-white px-4 py-2.5 text-sm font-semibold text-cactus-charcoal shadow-sm transition hover:border-cactus-forest hover:text-cactus-forest"
        >
          Bloquear horario
        </button>
      </div>

      <div className="premium-card mt-6 inline-block px-5 py-4">
        <label htmlFor="panel-date" className="text-xs font-bold uppercase tracking-widest text-stone-500">
          Fecha
        </label>
        <input
          id="panel-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-premium mt-2"
        />
      </div>

      <div className="premium-card mt-6 overflow-hidden">
        {dayReservations.length === 0 ? (
          <p className="p-8 text-center text-stone-500">
            No hay reservas para esta fecha.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-600">Hora</th>
                <th className="px-4 py-3 font-semibold text-stone-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-stone-600">Teléfono</th>
                <th className="px-4 py-3 font-semibold text-stone-600">Pers.</th>
                <th className="px-4 py-3 font-semibold text-stone-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-stone-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dayReservations.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
                >
                  <td className="px-4 py-3 font-mono font-semibold">{r.time}</td>
                  <td className="px-4 py-3 font-medium">{r.customerName}</td>
                  <td className="px-4 py-3 font-mono text-stone-500">{r.phone}</td>
                  <td className="px-4 py-3">{r.partySize}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.status !== "cancelled" &&
                      r.status !== "completed" &&
                      r.status !== "no_show" && (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, "completed")}
                            className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 transition hover:bg-green-200"
                          >
                            Llegó
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, "no_show")}
                            className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 transition hover:bg-red-200"
                          >
                            No llegó
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.id, "cancelled")}
                            className="rounded-md bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-300"
                          >
                            Canceló
                          </button>
                        </div>
                      )}
                    {(r.status === "completed" ||
                      r.status === "no_show" ||
                      r.status === "cancelled") && (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {blockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cactus-charcoal/50 p-4 backdrop-blur-sm">
          <div className="premium-card w-full max-w-md p-6">
            <h2 className="font-display text-xl font-bold text-cactus-charcoal">
              Bloquear horario
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {/* TODO: implementar lógica de bloqueo de horarios en Fase 2 */}
              Esta función estará disponible en una fase posterior. Por ahora
              puedes marcar reservas como canceladas manualmente.
            </p>
            <button
              type="button"
              onClick={() => setBlockModalOpen(false)}
              className="btn-secondary mt-6 w-full py-3 text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
