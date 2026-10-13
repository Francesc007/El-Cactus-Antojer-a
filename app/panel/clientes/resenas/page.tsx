"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/panel/ConfirmDialog";
import { ReviewImageDialog } from "@/components/panel/loyalty/ReviewImageDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiRequest } from "@/lib/api-client";
import { REVIEW_PLATFORM_LABEL } from "@/lib/reviews";
import type { ReviewListItem, ReviewListPage, ReviewPeriod, ReviewStatus } from "@/lib/types";

const STATUS_FILTERS: ReviewStatus[] = ["pending", "approved", "rejected"];
const PERIODS: { id: ReviewPeriod; label: string }[] = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "all", label: "Histórico" },
];

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

function statusLabel(status: ReviewStatus): string {
  if (status === "pending") {
    return "pendientes";
  }
  if (status === "approved") {
    return "aprobadas";
  }
  return "rechazadas";
}

export default function ResenasPage() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [period, setPeriod] = useState<ReviewPeriod>("week");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ReviewListPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReviewListItem | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    review: ReviewListItem;
    nextStatus: "approved" | "rejected";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (nextStatus: ReviewStatus, nextPeriod: ReviewPeriod, nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ReviewListPage>(
        `/api/loyalty/reviews?status=${nextStatus}&range=${nextPeriod}&page=${nextPage}`
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status, period, page);
  }, [load, status, period, page]);

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
      await load(status, period, page);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar la reseña.");
    } finally {
      setActionLoading(false);
    }
  }

  const reviews = result?.reviews ?? [];
  const total = result?.total ?? 0;
  const pageSize = result?.pageSize ?? 9;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isReject = pendingAction?.nextStatus === "rejected";

  return (
    <div className="space-y-4">
      <ReviewImageDialog
        open={preview !== null && !preview?.archived && Boolean(preview?.imageUrl)}
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
          Revisa las capturas pendientes. Aprobadas y rechazadas quedan en el historial.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setStatus(item);
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              status === item ? "bg-cactus-forest text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {item === "pending" ? "Pendientes" : item === "approved" ? "Aprobadas" : "Rechazadas"}
          </button>
        ))}
      </div>

      {status !== "pending" && (
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPeriod(item.id);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                period === item.id
                  ? "bg-cactus-charcoal text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {loading && <LoadingSpinner label="Cargando reseñas" />}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-stone-500">No hay reseñas {statusLabel(status)} en este grupo.</p>
      )}

      {!loading && !error && status === "pending" && reviews.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <PendingReviewCard
                review={review}
                onPreview={() => setPreview(review)}
                onApprove={() => setPendingAction({ review, nextStatus: "approved" })}
                onReject={() => setPendingAction({ review, nextStatus: "rejected" })}
              />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && status !== "pending" && reviews.length > 0 && (
        <ReviewHistoryTable reviews={reviews} onPreview={setPreview} />
      )}

      {!loading && !error && total > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cactus-sand/60 pt-3">
          <p className="text-xs text-stone-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewThumb({
  review,
  onPreview,
}: {
  review: ReviewListItem;
  onPreview: () => void;
}) {
  if (review.archived) {
    return (
      <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 px-1 text-center text-[10px] font-semibold leading-tight text-stone-400">
        Evidencia archivada
      </span>
    );
  }
  if (!review.imageUrl) {
    return (
      <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-[10px] text-stone-400">
        Sin imagen
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onPreview}
      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100"
      aria-label={`Ver captura de ${review.fullName}`}
    >
      {/* URL firmada de corta duración; no pasa por el optimizador. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={review.imageUrl} alt="" className="h-full w-full object-cover" />
    </button>
  );
}

function PendingReviewCard({
  review,
  onPreview,
  onApprove,
  onReject,
}: {
  review: ReviewListItem;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="premium-card flex items-center gap-3 p-2.5">
      <ReviewThumb review={review} onPreview={onPreview} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-cactus-charcoal">{review.fullName}</p>
        <p className="truncate text-[11px] text-stone-400">
          {review.folio} · {displayPhone(review.phone)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PLATFORM_CLASS[review.platform]}`}>
            {REVIEW_PLATFORM_LABEL[review.platform]}
          </span>
          <span className="text-[11px] text-stone-400">{review.createdAtLabel}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={onApprove}
          className="rounded-lg bg-cactus-forest px-2.5 py-1.5 text-[11px] font-bold text-white"
        >
          Aprobar
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-700"
        >
          Rechazar
        </button>
      </div>
    </article>
  );
}

function ReviewHistoryTable({
  reviews,
  onPreview,
}: {
  reviews: ReviewListItem[];
  onPreview: (review: ReviewListItem) => void;
}) {
  return (
    <div className="premium-card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            <th className="px-3 py-2 font-semibold">Imagen</th>
            <th className="px-3 py-2 font-semibold">Cliente</th>
            <th className="px-3 py-2 font-semibold">Folio</th>
            <th className="px-3 py-2 font-semibold">Teléfono</th>
            <th className="px-3 py-2 font-semibold">Red</th>
            <th className="px-3 py-2 font-semibold">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} className="border-b border-stone-50 last:border-0">
              <td className="px-3 py-2">
                <ReviewThumb review={review} onPreview={() => onPreview(review)} />
              </td>
              <td className="px-3 py-2 text-sm font-medium text-stone-700">{review.fullName}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-stone-400">{review.folio}</td>
              <td className="px-3 py-2 text-xs text-stone-400">{displayPhone(review.phone)}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PLATFORM_CLASS[review.platform]}`}>
                  {REVIEW_PLATFORM_LABEL[review.platform]}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-stone-400">
                {review.validatedAtLabel ?? review.createdAtLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
