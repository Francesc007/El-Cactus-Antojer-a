"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PrivacyLink } from "@/components/ui/PrivacyLink";
import { ApiRequestError, apiFormRequest } from "@/lib/api-client";
import { LOYALTY_HONEYPOT_FIELD, LOYALTY_PHOTO_MAX_BYTES } from "@/lib/loyalty";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function LoyaltySignupForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choosePhoto(file: File | null) {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (!file) {
      setPhoto(null);
      setPreview(null);
      return;
    }
    if (file.size > LOYALTY_PHOTO_MAX_BYTES) {
      setError("La foto debe pesar menos de 2 MB.");
      setPhoto(null);
      setPreview(null);
      return;
    }
    setError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || !photo || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    form.set("photo", photo);
    form.set("marketingConsent", "yes");
    try {
      const data = await apiFormRequest<{ folio: string }>("/api/loyalty/members", form);
      router.push(`/tarjeta/${encodeURIComponent(data.folio)}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear la tarjeta.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="premium-card relative mx-auto max-w-lg space-y-4 p-5">
      <div>
        <p className="section-eyebrow">Clientes frecuentes</p>
        <h1 className="section-title mt-2">Genera tu tarjeta VIP</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Con tu foto, tu folio y un código QR para que en el negocio cuenten tus visitas.
        </p>
      </div>

      <label className="block text-sm font-semibold text-stone-700">
        Nombre
        <input name="fullName" required minLength={2} maxLength={80} autoComplete="name" className="input-premium mt-1" />
      </label>

      <label className="block text-sm font-semibold text-stone-700">
        Teléfono
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="10 dígitos"
          className="input-premium mt-1"
        />
      </label>

      <fieldset className="space-y-3 border-0 p-0">
        <legend className="mb-0 w-full text-sm font-semibold text-stone-700">
          ¿Cuándo es tu cumpleaños?
          <span className="mt-0.5 block text-xs font-normal leading-snug text-stone-500">
            El día y el mes nos sirven para felicitarte. El año no es obligatorio.
          </span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-stone-700">
            Día
            <select name="birthDay" required defaultValue="" className="input-premium mt-1">
              <option value="" disabled>
                Día
              </option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Mes
            <select name="birthMonth" required defaultValue="" className="input-premium mt-1">
              <option value="" disabled>
                Mes
              </option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold text-stone-700">
          Año <span className="font-normal text-stone-500">(opcional)</span>
          <input
            name="birthYear"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            placeholder="Si lo quieres dar"
            className="input-premium mt-1"
          />
        </label>
      </fieldset>

      <div>
        <p className="text-sm font-semibold text-stone-700">Foto</p>
        <div className="mt-2 flex items-center gap-3">
          {preview ? (
            // Vista local antes de enviarla. No sale del celular hasta guardar.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Tu foto" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 text-xs text-stone-400">
              Foto
            </div>
          )}
          <div className="flex flex-1 gap-2">
            <label className="flex flex-1 cursor-pointer flex-col items-center rounded-xl border border-cactus-sand bg-white px-3 py-3 text-xs font-bold text-cactus-forest">
              <CameraIcon />
              Cámara
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                className="sr-only"
                onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="flex flex-1 cursor-pointer flex-col items-center rounded-xl border border-cactus-sand bg-white px-3 py-3 text-xs font-bold text-cactus-forest">
              <GalleryIcon />
              Galería
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-stone-700">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-cactus-forest"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          Acepto recibir mensajes de cumpleaños y promociones de El Cactus.{" "}
          <PrivacyLink className="font-semibold text-cactus-forest underline">
            Aviso de privacidad
          </PrivacyLink>
        </span>
      </label>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Fax
          <input type="text" name={LOYALTY_HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={!consent || !photo || submitting}>
        {submitting ? "Creando tarjeta…" : "Crear mi tarjeta"}
      </button>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mb-1 h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h3l1.5-2h7L17 8h3v10H4V8z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mb-1 h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 14l2.5-2.5L14 15l2-2 2 2" />
      <circle cx="9" cy="9" r="1" />
    </svg>
  );
}
