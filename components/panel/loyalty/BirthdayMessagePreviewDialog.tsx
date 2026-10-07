"use client";

import type { BirthdayEntry } from "@/lib/types";
import { isDemoLoyaltyMember } from "@/lib/loyalty";

type BirthdayMessagePreviewDialogProps = {
  entry: BirthdayEntry | null;
  onClose: () => void;
};

export function BirthdayMessagePreviewDialog({ entry, onClose }: BirthdayMessagePreviewDialogProps) {
  if (!entry) {
    return null;
  }

  const isDemo = isDemoLoyaltyMember(entry.folio, entry.fullName);
  const timeLabel = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="birthday-preview-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-cactus-charcoal/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[#075E54] px-4 py-3 text-white">
          <p id="birthday-preview-title" className="text-xs font-semibold uppercase tracking-widest text-white/80">
            Vista previa · WhatsApp
          </p>
          <p className="mt-1 font-display text-lg font-bold">El Cactus Antojería</p>
          <p className="text-xs text-white/85">
            Para {entry.firstName} · Folio {entry.folio}
          </p>
        </div>

        <div
          className="space-y-3 px-4 py-5"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #e5ddd5 0%, #d9cfc7 100%)",
          }}
        >
          <div className="mx-auto max-w-[92%] rounded-lg rounded-tl-none bg-[#DCF8C6] px-3 py-2.5 shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#075E54]/90">
              El Cactus Antojería
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-900">
              {entry.messagePreview}
            </p>
            <p className="mt-2 text-right text-[10px] text-stone-500">{timeLabel} ✓✓</p>
          </div>
          <p className="text-center text-[10px] font-medium text-stone-600/90">
            Mensaje de cumpleaños · {entry.whenLabel}
          </p>
        </div>

        <div className="border-t border-stone-100 bg-stone-50 px-4 py-3">
          {isDemo ? (
            <p className="text-center text-xs leading-relaxed text-stone-600">
              Cliente de demostración: aquí solo ves cómo llegará el mensaje. No se abre WhatsApp
              web para evitar envíos a números de prueba.
            </p>
          ) : (
            <p className="text-center text-xs leading-relaxed text-stone-600">
              Así verá el cliente el mensaje en WhatsApp. Cuando confirmes, usa tu app para
              enviarlo o el envío automático si está activo.
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary mt-3 w-full py-2.5 text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
