"use client";

import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  tone?: "forest" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  error = null,
  tone = "forest",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-cactus-charcoal/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-premium ring-1 ${
          isDanger
            ? "border-red-300/70 bg-gradient-to-br from-white via-white to-red-50/80 ring-red-200/40"
            : "border-cactus-forest/35 bg-gradient-to-br from-white via-white to-cactus-forest/8 ring-cactus-forest/10"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="section-eyebrow">{isDanger ? "Atención" : "Confirmación"}</p>
        <h2
          id="confirm-dialog-title"
          className="font-display text-xl font-bold text-cactus-charcoal"
        >
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-stone-600">{description}</div>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger
                ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                : "btn-secondary py-3"
            }`}
          >
            {loading ? "Procesando…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border-2 border-cactus-forest/35 bg-white px-4 py-3 text-sm font-semibold text-cactus-forest transition hover:bg-cactus-forest/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
