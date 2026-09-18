"use client";

import { useEffect, useState } from "react";
import { useReservations } from "@/context/ReservationContext";
import { PanelStatCard } from "@/components/panel/PanelStatCard";
import { DatePicker } from "@/components/ui/DatePicker";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { apiRequest } from "@/lib/api-client";
import { todayStr } from "@/lib/dates";
import type { BlockedSlot, ReservationStatus } from "@/lib/types";

export default function PanelReservasPage() {
  const {
    getReservationsForDate,
    updateReservationStatus,
    selectedDate,
    setSelectedDate,
    loading,
    error,
    refresh,
  } = useReservations();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockError, setBlockError] = useState<string | null>(null);

  const dayReservations = getReservationsForDate(selectedDate);
  const activeReservations = dayReservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show"
  );
  const pendingReservations = dayReservations.filter((r) => r.status === "pending");
  const totalGuests = activeReservations.reduce((sum, r) => sum + r.partySize, 0);

  useEffect(() => {
    if (!selectedDate) setSelectedDate(todayStr());
  }, [selectedDate, setSelectedDate]);

  useEffect(() => {
    async function loadBlocks() {
      try {
        const data = await apiRequest<{ slots: BlockedSlot[] }>(
          `/api/blocked-slots?date=${selectedDate}`
        );
        setBlockedSlots(data.slots);
      } catch {
        setBlockedSlots([]);
      }
    }
    void loadBlocks();
  }, [selectedDate]);

  async function handleStatusChange(id: string, status: ReservationStatus) {
    await updateReservationStatus(id, status);
  }

  async function handleBlock(e: React.FormEvent) {
    e.preventDefault();
    setBlockError(null);
    try {
      const data = await apiRequest<{ slot: BlockedSlot }>("/api/blocked-slots", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          startTime,
          endTime,
          reason: reason.trim() || undefined,
        }),
      });
      setBlockedSlots((prev) => [...prev, data.slot]);
      setBlockModalOpen(false);
      setReason("");
      await refresh();
    } catch (err) {
      setBlockError(err instanceof Error ? err.message : "No se pudo bloquear");
    }
  }

  async function handleUnblock(id: string) {
    await apiRequest(`/api/blocked-slots?id=${id}`, { method: "DELETE" });
    setBlockedSlots((prev) => prev.filter((slot) => slot.id !== id));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="section-eyebrow">Operación</p>
          <h1 className="section-title mt-1">Agenda de reservas</h1>
          <p className="mt-1 text-sm text-stone-600 sm:text-base">
            Gestiona llegadas, cancelaciones y quienes no llegaron del día.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBlockModalOpen(true)}
          className="w-full rounded-xl border border-cactus-sand bg-white px-4 py-2.5 text-sm font-semibold text-cactus-charcoal shadow-sm transition hover:border-cactus-forest hover:text-cactus-forest sm:w-auto"
        >
          Bloquear horario
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <PanelStatCard
          label="Reservas del día"
          icon="📅"
          tone="forest"
          value={<span className="text-cactus-forest">{activeReservations.length}</span>}
        />
        <PanelStatCard
          label="Comensales"
          icon="👥"
          tone="sunset"
          value={<span className="text-cactus-sunset">{totalGuests}</span>}
        />
        <PanelStatCard
          label="Pendientes"
          icon="⏳"
          tone="lime"
          value={<span className="text-cactus-charcoal">{pendingReservations.length}</span>}
        />
      </div>

      <PanelStatCard label="Fecha" tone="neutral" className="relative z-20 mt-4 w-full max-w-md overflow-visible">
        <DatePicker
          id="panel-date"
          value={selectedDate}
          onChange={setSelectedDate}
          className="mt-2"
        />
      </PanelStatCard>

      {blockedSlots.length > 0 && (
        <div className="premium-card mt-4 p-4">
          <p className="text-sm font-bold text-stone-700">Horarios bloqueados</p>
          <ul className="mt-2 space-y-2 text-sm">
            {blockedSlots.map((slot) => (
              <li key={slot.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-words">
                  {slot.startTime} – {slot.endTime}
                  {slot.reason ? ` · ${slot.reason}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => void handleUnblock(slot.id)}
                  className="text-xs font-semibold text-red-700"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="premium-card mt-6 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-stone-500">Cargando agenda…</p>
        ) : error ? (
          <p className="p-8 text-center text-red-700">{error}</p>
        ) : dayReservations.length === 0 ? (
          <p className="p-8 text-center text-stone-500">
            No hay reservas para esta fecha.
          </p>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {dayReservations.map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-cactus-sand/70 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-base font-bold text-cactus-charcoal">
                        {r.time}
                      </p>
                      <p className="mt-1 truncate font-semibold">{r.customerName}</p>
                      <p className="mt-0.5 font-mono text-xs text-stone-500">{r.phone}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={r.status} />
                      <p className="mt-2 text-xs font-semibold text-stone-500">
                        {r.partySize} pers.
                      </p>
                    </div>
                  </div>
                  {r.status !== "cancelled" &&
                    r.status !== "completed" &&
                    r.status !== "no_show" && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(r.id, "completed")}
                          className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"
                        >
                          Llegó
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(r.id, "no_show")}
                          className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800"
                        >
                          No llegó
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(r.id, "cancelled")}
                          className="rounded-md bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700"
                        >
                          Canceló
                        </button>
                      </div>
                    )}
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                            onClick={() => void handleStatusChange(r.id, "completed")}
                            className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 transition hover:bg-green-200"
                          >
                            Llegó
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleStatusChange(r.id, "no_show")}
                            className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 transition hover:bg-red-200"
                          >
                            No llegó
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleStatusChange(r.id, "cancelled")}
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
            </div>
          </>
        )}
      </div>

      {blockModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-slot-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-cactus-charcoal/50 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={handleBlock}
            className="max-h-[min(36rem,90dvh)] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-cactus-forest/35 bg-gradient-to-br from-white via-white to-cactus-forest/8 p-6 shadow-premium ring-1 ring-cactus-forest/10"
          >
            <h2 id="block-slot-title" className="font-display text-xl font-bold text-cactus-charcoal">
              Bloquear horario
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Ese rango no estará disponible para reservas públicas.
            </p>
            {blockError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {blockError}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="block-start" className="text-sm font-semibold">
                  Desde
                </label>
                <input
                  id="block-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="input-premium mt-1"
                />
              </div>
              <div>
                <label htmlFor="block-end" className="text-sm font-semibold">
                  Hasta
                </label>
                <input
                  id="block-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="input-premium mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="block-reason" className="text-sm font-semibold">
                Motivo (opcional)
              </label>
              <input
                id="block-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-premium mt-1"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button type="submit" className="btn-secondary flex-1 py-3 text-sm">
                Bloquear
              </button>
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="flex-1 rounded-xl border-2 border-cactus-forest/35 bg-white px-4 py-3 text-sm font-semibold text-cactus-forest transition hover:bg-cactus-forest/5"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
