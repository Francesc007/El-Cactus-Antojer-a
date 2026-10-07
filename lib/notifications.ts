import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import {
  buildWhatsAppSendUrl,
  formatReservationWhatsAppMessage,
} from "@/lib/reservation-whatsapp-message";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Product, Reservation } from "@/lib/types";

export type NotificationResult = {
  message: string;
  customerName: string;
  /** Texto plano UTF-8; el navegador debe armar la URL (evita emojis rotos en WhatsApp Web). */
  whatsappMessage: string | null;
  whatsappBusinessPhone: string | null;
  whatsappUrl: string | null;
  provider: "wa_me" | "whatsapp_cloud";
};

export function buildReservationWhatsAppUrl(reservation: Reservation): string {
  const env = getServerEnv();
  const message = formatReservationWhatsAppMessage(reservation);
  return buildWhatsAppSendUrl(env.whatsappBusinessNumber, message);
}

export async function recordNotificationAttempt(
  outboxId: string,
  provider: string,
  success: boolean,
  response: Record<string, unknown> | null,
  error?: string
) {
  const admin = createAdminSupabaseClient();
  await admin.from("notification_attempts").insert({
    outbox_id: outboxId,
    provider,
    success,
    response,
    error: error ?? null,
  });
  await admin
    .from("notification_outbox")
    .update({ status: success ? "sent" : "failed" })
    .eq("id", outboxId);
}

export async function sendWhatsAppTemplate(
  to: string,
  template: string,
  parameters: string[]
) {
  const env = getServerEnv();
  if (!env.whatsappCloudToken || !env.whatsappCloudPhoneNumberId || !template) {
    throw new Error("WhatsApp Cloud API no está configurada");
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${env.whatsappCloudPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.whatsappCloudToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: "es_MX" },
          components: [
            {
              type: "body",
              parameters: parameters.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    }
  );

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(JSON.stringify(json));
  }
  return json;
}

function waMeNotificationResult(
  reservation: Reservation,
  whatsappMessage: string,
  whatsappBusinessPhone: string,
  whatsappUrl: string
): NotificationResult {
  return {
    message: "Reserva guardada. Abre WhatsApp para avisar al negocio.",
    customerName: reservation.customerName,
    whatsappMessage,
    whatsappBusinessPhone,
    whatsappUrl,
    provider: "wa_me",
  };
}

export async function enqueueReservationNotification(
  reservation: Reservation
): Promise<NotificationResult> {
  const env = getServerEnv();
  const admin = createAdminSupabaseClient();
  const whatsappMessage = formatReservationWhatsAppMessage(reservation);
  const whatsappBusinessPhone = env.whatsappBusinessNumber.replace(/\D/g, "");
  const whatsappUrl = buildWhatsAppSendUrl(env.whatsappBusinessNumber, whatsappMessage);
  const payload = {
    reservationId: reservation.id,
    customerName: reservation.customerName,
    phone: reservation.phone,
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.partySize,
    whatsappMessage,
    whatsappBusinessPhone,
    whatsappUrl,
  };

  const { data: outbox, error } = await admin
    .from("notification_outbox")
    .insert({
      type: "reservation_created",
      channel: env.notificationProvider,
      payload,
      status: "pending",
      related_reservation_id: reservation.id,
    })
    .select("id")
    .single();

  if (error || !outbox) {
    logEvent("error", {
      message: "No se pudo guardar el outbox de notificación",
      code: "NOTIFY_OUTBOX",
    });
    return waMeNotificationResult(
      reservation,
      whatsappMessage,
      whatsappBusinessPhone,
      whatsappUrl
    );
  }

  if (env.notificationProvider === "whatsapp_cloud") {
    try {
      await sendWhatsAppTemplate(
        env.whatsappCloudOwnerPhone || env.whatsappBusinessNumber,
        env.whatsappCloudTemplateOwner,
        [whatsappMessage]
      );
      await sendWhatsAppTemplate(
        `52${reservation.phone}`,
        env.whatsappCloudTemplateCustomer,
        [
          `Tu reserva en El Cactus quedó confirmada el ${reservation.date} a las ${reservation.time}.`,
        ]
      );
      await recordNotificationAttempt(outbox.id, "whatsapp_cloud", true, { ok: true });
      return {
        message: "Confirmación enviada por WhatsApp al cliente y al negocio.",
        customerName: reservation.customerName,
        whatsappMessage: null,
        whatsappBusinessPhone: null,
        whatsappUrl: null,
        provider: "whatsapp_cloud",
      };
    } catch (cloudError) {
      const details = cloudError instanceof Error ? cloudError.message : "cloud_error";
      await recordNotificationAttempt(outbox.id, "whatsapp_cloud", false, null, details);
      logEvent("warn", {
        message: "Cloud API falló; se usa wa.me de respaldo",
        code: "NOTIFY_CLOUD_FALLBACK",
      });
    }
  }

  await recordNotificationAttempt(outbox.id, "wa_me", true, { whatsappUrl });
  return waMeNotificationResult(
    reservation,
    whatsappMessage,
    whatsappBusinessPhone,
    whatsappUrl
  );
}

export async function enqueueLowStockNotification(
  product: Product,
  currentStock: number
): Promise<{ message: string }> {
  const admin = createAdminSupabaseClient();
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("notification_outbox")
    .select("id")
    .eq("type", "low_stock")
    .eq("related_product_id", product.id)
    .gte("created_at", since)
    .limit(1);

  if (recent && recent.length > 0) {
    return {
      message: `${product.name} sigue en stock bajo (${currentStock} ${product.unit}).`,
    };
  }

  await admin.from("notification_outbox").insert({
    type: "low_stock",
    channel: "wa_me",
    payload: {
      productId: product.id,
      name: product.name,
      stock: currentStock,
      minStock: product.minStock,
    },
    status: "pending",
    related_product_id: product.id,
  });

  return {
    message: `Alerta de stock bajo: ${product.name} tiene ${currentStock} ${product.unit} (mínimo: ${product.minStock}).`,
  };
}
