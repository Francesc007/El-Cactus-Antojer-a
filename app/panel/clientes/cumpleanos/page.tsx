"use client";

import { useCallback, useEffect, useState } from "react";
import { BirthdayMessagePreviewDialog } from "@/components/panel/loyalty/BirthdayMessagePreviewDialog";
import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { isDemoLoyaltyMember } from "@/lib/loyalty";
import { apiRequest } from "@/lib/api-client";
import type { BirthdayBoard, BirthdayEntry, BirthdaySendStatus } from "@/lib/types";

const STATUS_LABEL: Record<BirthdaySendStatus, string> = {
  sent: "Enviado",
  failed: "No se pudo enviar",
  pending: "Pendiente",
  none: "Sin enviar",
};

const STATUS_CLASS: Record<BirthdaySendStatus, string> = {
  sent: "bg-cactus-forest/10 text-cactus-forest",
  failed: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-800",
  none: "bg-stone-100 text-stone-600",
};

type BirthdayEntryCardProps = {
  entry: BirthdayEntry;
  provider: BirthdayBoard["provider"];
  onPreviewOrWhatsApp: (entry: BirthdayEntry) => void;
  onMarkSent: (entry: BirthdayEntry) => void;
};

function BirthdayEntryCard({ entry, provider, onPreviewOrWhatsApp, onMarkSent }: BirthdayEntryCardProps) {
  const demo = isDemoLoyaltyMember(entry.folio, entry.fullName);

  return (
    <li className="min-w-0">
      <article className="premium-card flex h-full flex-col items-center gap-2 p-3 text-center">
        <LoyaltyPhoto src={entry.photoUrl} name={entry.fullName} size="xs" initialOnly />
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold text-cactus-charcoal">{entry.fullName}</p>
          <p className="mt-0.5 font-mono text-[11px] font-bold tracking-wide text-stone-500">{entry.folio}</p>
          <p className="mt-1 text-xs font-medium text-cactus-sunset">{entry.whenLabel}</p>
          <p
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[entry.sendStatus]}`}
          >
            {STATUS_LABEL[entry.sendStatus]}
          </p>
        </div>
        {provider === "wa_me" && (
          <div className="mt-auto flex w-full flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => onPreviewOrWhatsApp(entry)}
              className="w-full rounded-xl bg-cactus-forest px-3 py-2 text-xs font-bold text-white"
            >
              {demo ? "Vista previa del mensaje" : "Ver mensaje en WhatsApp"}
            </button>
            {entry.sendStatus !== "sent" && (
              <button
                type="button"
                onClick={() => onMarkSent(entry)}
                className="w-full rounded-xl border border-cactus-forest px-3 py-2 text-xs font-bold text-cactus-forest"
              >
                Marcar como enviado
              </button>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

export default function CumpleanosPage() {
  const [board, setBoard] = useState<BirthdayBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewEntry, setPreviewEntry] = useState<BirthdayEntry | null>(null);

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

  function openWhatsAppOrPreview(entry: BirthdayEntry) {
    const demo = isDemoLoyaltyMember(entry.folio, entry.fullName);
    if (demo || !entry.whatsappUrl) {
      setPreviewEntry(entry);
      return;
    }
    window.open(entry.whatsappUrl, "_blank", "noopener,noreferrer");
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
      <BirthdayMessagePreviewDialog entry={previewEntry} onClose={() => setPreviewEntry(null)} />

      <div>
        <p className="section-eyebrow">Tarjeta VIP</p>
        <h1 className="section-title mt-1">Cumpleaños</h1>
        <p className="mt-1 text-sm text-stone-600">
          {board.provider === "wa_me"
            ? "Revisa cómo se verá el mensaje antes de enviarlo. Con clientes reales podrás abrir WhatsApp desde aquí."
            : "El envío automático usa la plantilla aprobada. Aquí ves si salió."}
        </p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="font-display text-lg font-bold">{section.title}</h2>
          {section.items.length === 0 && <p className="mt-2 text-sm text-stone-500">Nadie en este grupo.</p>}
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {section.items.map((entry) => (
              <BirthdayEntryCard
                key={`${section.title}-${entry.id}`}
                entry={entry}
                provider={board.provider}
                onPreviewOrWhatsApp={openWhatsAppOrPreview}
                onMarkSent={(item) => void markSent(item)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
