import type { Reservation } from "@/lib/types";

type ReservationMessageFields = Pick<
  Reservation,
  "customerName" | "phone" | "date" | "time" | "partySize"
>;

/** Code points explícitos: evita corrupción UTF-8 en bundles o enlaces wa.me. */
const ICON = {
  cactus: 0x1f335,
  person: 0x1f464,
  phone: 0x1f4f1,
  calendar: 0x1f4c5,
  clock: 0x1f550,
  people: 0x1f465,
} as const;

function icon(code: number): string {
  return String.fromCodePoint(code);
}

export function formatReservationWhatsAppMessage(reservation: ReservationMessageFields): string {
  const cactus = icon(ICON.cactus);
  return [
    `${cactus} El Cactus Antojería ${cactus}`,
    "━━━━━━━━━━━━━━━━━━━━",
    "Nueva reserva",
    "",
    `${icon(ICON.person)} Cliente: ${reservation.customerName}`,
    `${icon(ICON.phone)} Teléfono: ${reservation.phone}`,
    `${icon(ICON.calendar)} Fecha: ${reservation.date}`,
    `${icon(ICON.clock)} Hora: ${reservation.time}`,
    `${icon(ICON.people)} Personas: ${reservation.partySize}`,
  ].join("\n");
}

export function buildWhatsAppSendUrl(businessPhoneDigits: string, message: string): string {
  const phone = businessPhoneDigits.replace(/\D/g, "");
  return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}`;
}
