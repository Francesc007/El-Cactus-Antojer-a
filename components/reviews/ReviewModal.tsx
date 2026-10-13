"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ApiRequestError, apiFormRequest, apiRequest } from "@/lib/api-client";
import { compressReviewImage } from "@/lib/image-compress";
import {
  REVIEW_HONEYPOT_FIELD,
  REVIEW_IDENTIFIER_STORAGE_KEY,
  REVIEW_IMAGE_MAX_BYTES,
  REVIEW_PLATFORM_ACTION,
  REVIEW_PLATFORM_LABEL,
  REVIEW_PLATFORM_URL,
  REVIEW_PLATFORMS,
  REVIEW_THANKS_BODY,
  REVIEW_THANKS_TITLE,
  parseReviewIdentifier,
  reviewIdentifierHint,
} from "@/lib/reviews";
import type { ReviewPlatform, ReviewPublicStatus } from "@/lib/types";

type ReviewModalProps = {
  initialIdentifier: string;
  onClose: () => void;
};

type ModalView = "pick" | "evidence" | "thanks";

function readStoredIdentifier(): string {
  try {
    return window.localStorage.getItem(REVIEW_IDENTIFIER_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function writeStoredIdentifier(value: string): void {
  try {
    window.localStorage.setItem(REVIEW_IDENTIFIER_STORAGE_KEY, value.trim());
  } catch {
    // El celular puede bloquear el almacenamiento privado.
  }
}

export function storedReviewIdentifier(): string {
  return readStoredIdentifier();
}

export function ReviewModal({ initialIdentifier, onClose }: ReviewModalProps) {
  const [view, setView] = useState<ModalView>("pick");
  const [platform, setPlatform] = useState<ReviewPlatform | null>(null);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [googleSubmitted, setGoogleSubmitted] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [cardMissing, setCardMissing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async (value: string) => {
    if (!parseReviewIdentifier(value)) {
      return;
    }
    setStatusLoading(true);
    try {
      const data = await apiRequest<ReviewPublicStatus>(
        `/api/loyalty/evidence/status?q=${encodeURIComponent(value)}`
      );
      setGoogleSubmitted(data.googleSubmitted);
      setFirstName(data.firstName);
      setCardMissing(false);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setCardMissing(true);
        setGoogleSubmitted(false);
        setFirstName(null);
      }
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialIdentifier) {
      return;
    }
    void loadStatus(initialIdentifier);
  }, [initialIdentifier, loadStatus]);

  function choosePhoto(file: File | null) {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (!file) {
      setPhoto(null);
      setPreview(null);
      return;
    }
    setError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function choosePlatform(next: ReviewPlatform) {
    if (next === "google" && googleSubmitted) {
      return;
    }
    window.open(REVIEW_PLATFORM_URL[next], "_blank", "noopener,noreferrer");
    setPlatform(next);
    setView("evidence");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!platform || !photo || submitting) {
      return;
    }
    const parsed = parseReviewIdentifier(identifier);
    if (!parsed) {
      setError(reviewIdentifierHint());
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const compressed = await compressReviewImage(photo);
      if (compressed.size > REVIEW_IMAGE_MAX_BYTES) {
        throw new Error("La captura sigue pesando demasiado. Prueba con otra más clara y ligera.");
      }
      const form = new FormData();
      form.set("identifier", identifier.trim());
      form.set("platform", platform);
      form.set("photo", compressed);
      form.set(REVIEW_HONEYPOT_FIELD, "");
      await apiFormRequest<{ reviewId: string }>("/api/loyalty/evidence", form);
      writeStoredIdentifier(identifier);
      if (platform === "google") {
        setGoogleSubmitted(true);
      }
      setCardMissing(false);
      setView("thanks");
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo enviar la captura.";
      setError(message);
      if (err instanceof ApiRequestError && err.status === 404) {
        setCardMissing(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-cactus-charcoal/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={close}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-cactus-forest/25 bg-gradient-to-br from-white via-white to-cactus-cream p-5 shadow-premium ring-1 ring-cactus-forest/10"
        onClick={(event) => event.stopPropagation()}
      >
        {view === "pick" && (
          <div>
            <p className="section-eyebrow">Tu opinión nos ayuda</p>
            <h2 id="review-modal-title" className="font-display text-xl font-bold text-cactus-charcoal">
              Deja tu reseña
            </h2>
            <ReviewHint>
              Elige la red, haz tu publicación y{" "}
              <span className="text-cactus-sunset">captura la pantalla</span> para subirla aquí.
            </ReviewHint>
            {firstName ? (
              <p className="mt-2 text-sm text-stone-600">Gracias, {firstName}.</p>
            ) : null}
            {statusLoading && <p className="mt-2 text-xs text-stone-500">Revisando tu tarjeta…</p>}
            {cardMissing && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No encontramos una tarjeta VIP con ese dato.{" "}
                <Link href="/tarjeta" className="font-bold text-cactus-forest underline">
                  Genera tu tarjeta
                </Link>{" "}
                para enviar la evidencia.
              </p>
            )}
            <div className="mt-4 space-y-2">
              {REVIEW_PLATFORMS.map((item) => {
                const done = item === "google" && googleSubmitted;
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={done}
                    onClick={() => choosePlatform(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      done
                        ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                        : PLATFORM_CARD_CLASS[item]
                    }`}
                  >
                    <PlatformMark platform={item} muted={done} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-cactus-charcoal">
                        {REVIEW_PLATFORM_LABEL[item]}
                      </span>
                      <span className={`block text-xs ${done ? "text-stone-400" : "text-stone-500"}`}>
                        {done ? "Ya enviada" : REVIEW_PLATFORM_ACTION[item]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={close}
              className="mt-4 w-full rounded-xl border-2 border-cactus-forest/35 bg-white px-4 py-3 text-sm font-semibold text-cactus-forest"
            >
              Cerrar
            </button>
          </div>
        )}

        {view === "evidence" && platform && (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <p className="section-eyebrow">{REVIEW_PLATFORM_LABEL[platform]}</p>
            <h2 id="review-modal-title" className="font-display text-xl font-bold text-cactus-charcoal">
              Sube tu captura
            </h2>
            <ReviewHint>
              Te abrimos {REVIEW_PLATFORM_LABEL[platform]} en otra pestaña. Haz tu publicación y{" "}
              <span className="text-cactus-sunset">captura la pantalla</span>. Luego regresa aquí y súbela.
            </ReviewHint>

            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Teléfono o folio
              <input
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setCardMissing(false);
                }}
                required
                autoComplete="tel"
                placeholder="10 dígitos o C-0001"
                className="input-premium mt-1"
              />
            </label>
            <p className="mt-1 text-xs text-stone-500">{reviewIdentifierHint()}</p>

            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-700">Captura de pantalla</p>
              {preview ? (
                // Vista local de la captura antes de enviarla.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Vista previa de tu captura"
                  className="mt-2 max-h-48 w-full rounded-xl object-contain bg-stone-100"
                />
              ) : (
                <div className="mt-2 flex h-28 items-center justify-center rounded-xl bg-stone-100 text-sm text-stone-400">
                  Aún no eliges una imagen
                </div>
              )}
              <label className="mt-3 flex cursor-pointer flex-col items-center rounded-xl border border-cactus-sand bg-white px-3 py-3 text-sm font-bold text-cactus-forest">
                Elegir imagen
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {cardMissing && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No encontramos esa tarjeta.{" "}
                <Link href="/tarjeta" className="font-bold text-cactus-forest underline">
                  Genera tu tarjeta VIP
                </Link>
              </p>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label>
                Fax
                <input type="text" name={REVIEW_HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>

            <button type="submit" className="btn-primary mt-4 w-full py-3 text-base" disabled={!photo || submitting}>
              {submitting ? "Enviando…" : "Enviar imagen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setView("pick");
                setError(null);
              }}
              className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold text-stone-500"
            >
              Elegir otra red
            </button>
          </form>
        )}

        {view === "thanks" && (
          <div className="text-center">
            <p className="section-eyebrow">Listo</p>
            <h2 id="review-modal-title" className="font-display text-xl font-bold text-cactus-charcoal">
              {REVIEW_THANKS_TITLE}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{REVIEW_THANKS_BODY}</p>
            <button type="button" onClick={close} className="btn-primary mt-6 w-full py-3 text-base">
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-xl bg-cactus-sun/20 px-3 py-2.5 text-sm font-bold leading-snug text-cactus-charcoal">
      {children}
    </p>
  );
}

const PLATFORM_CARD_CLASS: Record<ReviewPlatform, string> = {
  google:
    "border-blue-200/80 bg-gradient-to-r from-blue-50 to-white hover:border-blue-300 hover:from-blue-100/70",
  facebook:
    "border-indigo-200/80 bg-gradient-to-r from-indigo-50 to-white hover:border-indigo-300 hover:from-indigo-100/70",
  instagram:
    "border-rose-200/80 bg-gradient-to-r from-rose-50 via-orange-50/70 to-white hover:border-rose-300 hover:from-rose-100/80",
};

const PLATFORM_MARK_CLASS: Record<ReviewPlatform, string> = {
  google: "bg-white shadow-sm ring-1 ring-blue-100",
  facebook: "bg-[#1877F2]/10 ring-1 ring-[#1877F2]/15",
  instagram: "bg-gradient-to-br from-yellow-100 via-rose-100 to-violet-100 ring-1 ring-rose-200/70",
};

function PlatformMark({ platform, muted }: { platform: ReviewPlatform; muted: boolean }) {
  const wrap = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
    muted ? "bg-stone-200 text-stone-400" : PLATFORM_MARK_CLASS[platform]
  }`;
  return (
    <span className={wrap} aria-hidden>
      {platform === "google" && <GoogleMark />}
      {platform === "facebook" && <FacebookMark />}
      {platform === "instagram" && <InstagramMark />}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.42z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.35l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.58A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.41 13.99A6.01 6.01 0 0 1 6.1 12c0-.69.12-1.36.31-1.99V7.43H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.57l3.35-2.58z" />
      <path fill="#EA4335" d="M12 5.88c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.9 14.7 2 12 2 7.94 2 4.43 4.34 3.06 7.43l3.35 2.58C7.2 7.64 9.4 5.88 12 5.88z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#1877F2" aria-hidden>
      <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#E1306C" aria-hidden>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.52.01-4.76.07-2.18.1-3.2 1.13-3.3 3.3-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.1 2.17 1.12 3.2 3.3 3.3 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c2.18-.1 3.2-1.13 3.3-3.3.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.1-2.17-1.12-3.2-3.3-3.3-1.24-.06-1.61-.07-4.76-.07zm0 3.07a4.97 4.97 0 1 1 0 9.94 4.97 4.97 0 0 1 0-9.94zm0 1.8a3.17 3.17 0 1 0 0 6.34 3.17 3.17 0 0 0 0-6.34zm6.4-3.12a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z" />
    </svg>
  );
}
