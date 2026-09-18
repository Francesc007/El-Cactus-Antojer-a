"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { privacyHref } from "@/lib/privacy-link";
import { apiRequest } from "@/lib/api-client";
import {
  CLOSED_DAYS_LABEL,
} from "@/lib/business-info";
import {
  formatDisplayDate,
  maxDateStr,
  todayStr,
} from "@/lib/dates";
import { DatePicker } from "@/components/ui/DatePicker";
import { Toast } from "@/components/ui/Toast";
import type { AvailabilitySlot, Reservation } from "@/lib/types";

export function ReservationForm() {
  const pathname = usePathname();
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");
  const [partySizeSelection, setPartySizeSelection] = useState("2");
  const [largePartySize, setLargePartySize] = useState("12");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [closed, setClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<{
    date: string;
    time: string;
    partySize: number;
    customerName: string;
  } | null>(null);

  const partySize =
    partySizeSelection === "large"
      ? Number.parseInt(largePartySize, 10)
      : Number(partySizeSelection);

  const isLargeParty = partySizeSelection === "large";
  const isLargePartySizeValid =
    !isLargeParty ||
    (Number.isInteger(partySize) && partySize >= 12 && partySize <= 50);

  const loadAvailability = useCallback(async (nextDate: string, nextPartySize: number) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const data = await apiRequest<{ closed: boolean; slots: AvailabilitySlot[] }>(
        `/api/availability?date=${nextDate}&partySize=${nextPartySize}`
      );
      setClosed(data.closed);
      setSlots(data.slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar disponibilidad");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!isLargePartySizeValid) {
      setSlots([]);
      return;
    }
    void loadAvailability(date, partySize);
  }, [date, partySize, isLargePartySizeValid, loadAvailability]);

  const selectedSlotAvailable =
    time === "" || slots.find((s) => s.time === time)?.available === true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!time || !selectedSlotAvailable || !privacyConsent || !isLargePartySizeValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest<{
        reservation: Reservation;
        notification: { message: string; whatsappUrl: string | null };
      }>("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          partySize,
          date,
          time,
          privacyConsent,
        }),
      });

      if (data.notification.whatsappUrl) {
        window.open(data.notification.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      setToastMessage(data.notification.message);
      setConfirmationDetails({
        date,
        time,
        partySize,
        customerName: customerName.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la reserva");
      void loadAvailability(date, partySize);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && confirmationDetails) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="premium-card border-2 border-cactus-forest/40 ring-1 ring-cactus-lime/30 p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cactus-lime/30 to-cactus-forest/20 ring-2 ring-cactus-lime/40">
            <span className="text-3xl text-cactus-forest">✓</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-cactus-forest">
            ¡Reserva confirmada!
          </h2>
          <p className="mt-3 text-stone-600">
            Gracias, <strong>{confirmationDetails.customerName}</strong>.
            Tu mesa para {confirmationDetails.partySize}{" "}
            {confirmationDetails.partySize === 1 ? "persona" : "personas"} está
            reservada el{" "}
            <strong>{formatDisplayDate(confirmationDetails.date)}</strong>{" "}
            a las <strong>{confirmationDetails.time}</strong>.
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex px-6 py-3 text-base">
            Volver al inicio
          </Link>
        </div>
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="premium-card space-y-6 border-2 border-cactus-forest/40 p-6 ring-1 ring-cactus-lime/30 sm:p-8"
      >
        <div className="border-b border-cactus-sand/60 pb-5">
          <p className="section-eyebrow">Tu experiencia</p>
          <h2 className="section-title mt-1 text-2xl">Completa tu reserva</h2>
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label htmlFor="date" className="block text-sm font-semibold text-stone-700">
            Fecha
          </label>
          <DatePicker
            id="date"
            value={date}
            min={todayStr()}
            max={maxDateStr()}
            onChange={(nextDate) => {
              setDate(nextDate);
              setTime("");
            }}
            required
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="partySize" className="block text-sm font-semibold text-stone-700">
            Número de personas
          </label>
          <select
            id="partySize"
            value={partySizeSelection}
            onChange={(e) => {
              setPartySizeSelection(e.target.value);
              setTime("");
            }}
            className="input-premium mt-1"
          >
            {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n} {n === 1 ? "persona" : "personas"}
              </option>
            ))}
            <option value="large">12+ personas</option>
          </select>
          {isLargeParty && (
            <div className="mt-3">
              <label
                htmlFor="largePartySize"
                className="block text-sm font-semibold text-stone-700"
              >
                ¿Cuántas personas serán?
              </label>
              <input
                id="largePartySize"
                type="number"
                inputMode="numeric"
                min={12}
                max={50}
                value={largePartySize}
                onChange={(e) => {
                  setLargePartySize(e.target.value);
                  setTime("");
                }}
                required
                placeholder="Ej. 15"
                className="input-premium mt-1"
              />
              {!isLargePartySizeValid && (
                <p className="mt-1 text-sm text-red-600">
                  Indica un número entre 12 y 50 personas.
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-700">Hora</p>
          {loadingSlots ? (
            <p className="mt-2 text-sm text-stone-500">Consultando disponibilidad…</p>
          ) : closed ? (
            <p className="mt-2 rounded-xl border border-cactus-sand bg-cactus-cream px-4 py-3 text-sm text-stone-600">
              {CLOSED_DAYS_LABEL}. Elige viernes, sábado o domingo.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map(({ time: slotTime, available }) => (
                <button
                  key={slotTime}
                  type="button"
                  disabled={!available}
                  onClick={() => setTime(slotTime)}
                  className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
                    time === slotTime
                      ? "bg-cactus-forest text-white shadow-glow-green ring-2 ring-cactus-lime"
                      : available
                        ? "bg-white text-stone-800 ring-1 ring-cactus-sand hover:ring-cactus-forest hover:shadow-sm"
                        : "cursor-not-allowed bg-stone-100 text-stone-400 line-through ring-1 ring-stone-200"
                  }`}
                >
                  {slotTime}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-stone-700">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Tu nombre completo"
            className="input-premium mt-1"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-stone-700">
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
            }}
            required
            placeholder="10 dígitos"
            pattern="[0-9]{10}"
            minLength={10}
            maxLength={10}
            className="input-premium mt-1"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            required
            className="mt-1"
          />
          <span>
            Acepto el{" "}
            <Link
              href={privacyHref(pathname)}
              className="font-semibold text-cactus-forest underline"
            >
              aviso de privacidad
            </Link>{" "}
            y el uso de mi teléfono para confirmar la reserva.
          </span>
        </label>

        <button
          type="submit"
          disabled={
            closed ||
            !time ||
            !selectedSlotAvailable ||
            submitting ||
            !privacyConsent ||
            !isLargePartySizeValid
          }
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? "Guardando…" : "Confirmar reserva"}
        </button>
      </form>
    </div>
  );
}
