"use client";

import { useCallback, useEffect, useState } from "react";
import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { apiRequest } from "@/lib/api-client";
import type { BirthdayBoard, BirthdayEntry, BirthdaySendStatus } from "@/lib/types";

const STATUS_LABEL: Record<BirthdaySendStatus, string> = {
  sent: "Enviado",
  failed: "No se pudo enviar",
  pending: "Pendiente",
  none: "Sin enviar",
};

export default function CumpleanosPage() {
  const [board, setBoard] = useState<BirthdayBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBoard(await apiRequest<BirthdayBoard>("/api/loyalty/birthdays"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markSent(entry: BirthdayEntry) {
    setError(null);
    try {
      await apiRequest("/api/loyalty/birthdays/mark-sent", {
        method: "POST",
        body: JSON.stringify({ memberId: entry.id, year: entry.year }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar como enviado.");
    }
  }

  if (loading && !board) {
    return <p className="text-stone-500">Cargando cumpleaños…</p>;
  }
  if (!board) {
    return <p className="text-red-700">{error}</p>;
  }

  const sections = [
    { title: "Hoy", items: board.today },
    { title: "Esta semana", items: board.week },
    { title: "Próximos 7 días", items: board.upcoming },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="section-eyebrow">Tarjeta VIP</p>
        <h1 className="section-title mt-1">Cumpleaños</h1>
        <p className="mt-1 text-sm text-stone-600">
          {board.provider === "wa_me"
            ? "El mensaje se abre en WhatsApp. Márcalo como enviado cuando ya lo mandes."
            : "El envío automático usa la plantilla aprobada. Aquí ves si salió."}
        </p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="font-display text-lg font-bold">{section.title}</h2>
          {section.items.length === 0 && <p className="mt-2 text-sm text-stone-500">Nadie en este grupo.</p>}
          <ul className="mt-3 space-y-3">
            {section.items.map((entry) => (
              <li key={`${section.title}-${entry.id}`} className="premium-card flex gap-3 p-3">
                <LoyaltyPhoto src={entry.photoUrl} name={entry.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{entry.fullName}</p>
                  <p className="text-sm text-stone-500">
                    {entry.folio} · {entry.whenLabel}
                  </p>
                  <p className="text-sm text-stone-600">{STATUS_LABEL[entry.sendStatus]}</p>
                  {board.provider === "wa_me" && entry.whatsappUrl && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={entry.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-cactus-forest px-3 py-2 text-xs font-bold text-white"
                      >
                        Abrir WhatsApp
                      </a>
                      {entry.sendStatus !== "sent" && (
                        <button
                          type="button"
                          onClick={() => void markSent(entry)}
                          className="rounded-xl border border-cactus-forest px-3 py-2 text-xs font-bold text-cactus-forest"
                        >
                          Marcar como enviado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
