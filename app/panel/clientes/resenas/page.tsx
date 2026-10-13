"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/panel/ConfirmDialog";
import { ReviewImageDialog } from "@/components/panel/loyalty/ReviewImageDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiRequest } from "@/lib/api-client";
import { REVIEW_PLATFORM_LABEL } from "@/lib/reviews";
import type { ReviewListItem, ReviewStatus } from "@/lib/types";

const FILTERS: ReviewStatus[] = ["pending", "approved", "rejected"];

const PLATFORM_CLASS: Record<ReviewListItem["platform"], string> = {
  google: "bg-blue-50 text-blue-800",
  facebook: "bg-indigo-50 text-indigo-800",
  instagram: "bg-pink-50 text-pink-800",
};

function displayPhone(phone: string): string {
  const local = phone.startsWith("52") && phone.length === 12 ? phone.slice(2) : phone;
  if (local.length !== 10) {
    return local;
  }
  return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
}

export default function ResenasPage() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReviewListItem | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    review: ReviewListItem;
    nextStatus: "approved" | "rejected";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (nextStatus: ReviewStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ reviews: ReviewListItem[] }>(
        `/api/loyalty/reviews?status=${nextStatus}`
      );
      setReviews(data.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  async function confirmAction() {
    if (!pendingAction) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await apiRequest(`/api/loyalty/reviews/${pendingAction.review.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: pendingAction.nextStatus }),
      });
      setPendingAction(null);
      await load(status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar la reseña.");
    } finally {
      setActionLoading(false);
    }
  }

  const isReject = pendingAction?.nextStatus === "rejected";

  return (
    <div className="space-y-6">
      <ReviewImageDialog
        open={preview !== null}
        src={preview?.imageUrl ?? null}
        name={preview?.fullName ?? ""}
        onClose={() => setPreview(null)}
      />
      <ConfirmDialog
        open={pendingAction !== null}
        title={isReject ? "¿Rechazar esta captura?" : "¿Validar esta reseña?"}
        description={
          pendingAction
            ? `${pendingAction.review.fullName} · ${REVIEW_PLATFORM_LABEL[pendingAction.review.platform]}`
            : ""
        }
        confirmLabel={isReject ? "Rechazar" : "Validar / Aprobar"}
        tone={isReject ? "danger" : "forest"}
        loading={actionLoading}
        error={actionError}
        onConfirm={() => void confirmAction()}
        onCancel={() => {
          if (!actionLoading) {
            setPendingAction(null);
            setActionError(null);
          }
        }}
      />

      <div>
        <p className="section-eyebrow">Tarjeta VIP</p>
        <h1 className="section-title mt-1">Verificación de Reseñas</h1>
        <p className="mt-1 text-sm text-stone-600">
          Revisa las capturas que envían los clientes. Al aprobar o rechazar, el estado queda registrado.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              status === item
                ? "bg-cactus-forest text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {item === "pending" ? "Pendientes" : item === "approved" ? "Aprobadas" : "Rechazadas"}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner label="Cargando reseñas" />}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-stone-500">
          No hay reseñas {status === "pending" ? "pendientes" : status === "approved" ? "aprobadas" : "rechazadas"}.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <article className="premium-card flex h-full flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-cactus-charcoal">{review.fullName}</p>
                  <p className="mt-0.5 font-mono text-[11px] font-bold tracking-wide text-stone-500">
                    {review.folio}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">{displayPhone(review.phone)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PLATFORM_CLASS[review.platform]}`}
                >
                  {REVIEW_PLATFORM_LABEL[review.platform]}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPreview(review)}
                className="mt-3 overflow-hidden rounded-xl bg-stone-100"
              >
                {review.imageUrl ? (
                  // URL firmada de corta duración; no pasa por el optimizador.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.imageUrl}
                    alt={`Captura de ${review.fullName}`}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-xs text-stone-400">
                    Sin imagen
                  </div>
                )}
              </button>

              <p className="mt-2 text-xs text-stone-500">{review.createdAtLabel}</p>

              {review.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingAction({ review, nextStatus: "approved" })}
                    className="flex-1 rounded-xl bg-cactus-forest px-3 py-2 text-xs font-bold text-white"
                  >
                    Validar / Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ review, nextStatus: "rejected" })}
                    className="flex-1 rounded-xl border border-red-300 px-3 py-2 text-xs font-bold text-red-700"
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
