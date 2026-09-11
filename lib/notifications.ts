import type { Reservation } from "./types";

export type NotificationResult = {
  message: string;
  customerName: string;
};

export function notifyReservationCreated(
  reservation: Reservation
): NotificationResult {
  // TODO: conectar a WhatsApp Cloud API para confirmación al cliente y aviso al dueño
  return {
    message: `Notificación enviada (simulada) a ${reservation.customerName} y al dueño del negocio`,
    customerName: reservation.customerName,
  };
}
