"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useReservations } from "@/context/ReservationContext";
import {
  getAllSlotsForDate,
  isOpenDay,
  isSlotAvailable,
} from "@/lib/availability";
import { CLOSED_DAYS_LABEL } from "@/lib/business-info";
import {
  formatDisplayDate,
  maxDateStr,
  todayStr,
} from "@/lib/dates";
import { notifyReservationCreated } from "@/lib/notifications";
import { Toast } from "@/components/ui/Toast";

export function ReservationForm() {
  const { reservations, capacityConfig, addReservation } = useReservations();

  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmationDetails, setConfirmationDetails] = useState<{
    date: string;
    time: string;
    partySize: number;
    customerName: string;
  } | null>(null);

  const isClosed = !isOpenDay(date);
  const slots = useMemo(() => getAllSlotsForDate(date), [date]);

  const slotAvailability = useMemo(
    () =>
      slots.map((slot) => ({
        time: slot,
        available: isSlotAvailable(
          reservations,
          capacityConfig,
          date,
          slot,
          partySize
        ),
      })),
    [slots, reservations, capacityConfig, date, partySize]
  );

  const selectedSlotAvailable =
    time === "" ||
    slotAvailability.find((s) => s.time === time)?.available === true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!time || !selectedSlotAvailable) return;

    const reservation = addReservation({
      customerName: customerName.trim(),
      phone: phone.trim(),
      partySize,
      date,
      time,
    });

    const notification = notifyReservationCreated(reservation);
    setToastMessage(notification.message);
    setConfirmationDetails({
      date,
      time,
      partySize,
      customerName: customerName.trim(),
    });
    setSubmitted(true);
  }

  if (submitted && confirmationDetails) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="premium-card p-8">
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
          <Link href="/" className="btn-secondary mt-8 px-6 py-3 text-base">
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
      <form onSubmit={handleSubmit} className="premium-card space-y-6 p-6 sm:p-8">
        <div className="border-b border-cactus-sand/60 pb-5">
          <p className="section-eyebrow">Tu experiencia</p>
          <h2 className="section-title mt-1 text-2xl">Completa tu reserva</h2>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-semibold text-stone-700">
            Fecha
          </label>
          <input
            id="date"
            type="date"
            value={date}
            min={todayStr()}
            max={maxDateStr()}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
            required
            className="input-premium mt-1"
          />
        </div>

        <div>
          <label htmlFor="partySize" className="block text-sm font-semibold text-stone-700">
            Número de personas
          </label>
          <select
            id="partySize"
            value={partySize}
            onChange={(e) => {
              setPartySize(Number(e.target.value));
              setTime("");
            }}
            className="input-premium mt-1"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "persona" : "personas"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-700">Hora</p>
          {isClosed ? (
            <p className="mt-2 rounded-xl border border-cactus-sand bg-cactus-cream px-4 py-3 text-sm text-stone-600">
              {CLOSED_DAYS_LABEL}. Elige viernes, sábado o domingo.
            </p>
          ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slotAvailability.map(({ time: slotTime, available }) => (
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
          {!isClosed && !selectedSlotAvailable && time && (
            <p className="mt-2 text-sm text-red-600">
              Este horario ya no tiene capacidad para {partySize} personas.
            </p>
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="10 dígitos"
            pattern="[0-9]{10}"
            className="input-premium mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={isClosed || !time || !selectedSlotAvailable}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          Confirmar reserva
        </button>
      </form>
    </div>
  );
}
