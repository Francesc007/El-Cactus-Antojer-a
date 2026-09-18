import { getServerEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Product, Reservation } from "@/lib/types";

export type NotificationResult = {
  message: string;
  customerName: string;
  whatsappUrl: string | null;
  provider: "wa_me" | "whatsapp_cloud";
};

function reservationText(reservation: Reservation): string {
  return [
    "🌵 El Cactus Antojería 🌵",
    "━━━━━━━━━━━━━━━━━━━━",
    "Nueva reserva",
    "",
    `👤 Cliente: ${reservation.customerName}`,
    `📱 Teléfono: ${reservation.phone}`,
    `📅 Fecha: ${reservation.date}`,
    `🕐 Hora: ${reservation.time}`,
    `👥 Personas: ${reservation.partySize}`,
  ].join("\n");
}

export function buildReservationWhatsAppUrl(reservation: Reservation): string {
  const number = getServerEnv().whatsappBusinessNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(reservationText(reservation))}`;
}

async function recordAttempt(
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

async function sendWhatsAppCloud(to: string, template: string, body: string) {
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
              parameters: [{ type: "text", text: body }],
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

export async function enqueueReservationNotification(
  reservation: Reservation
): Promise<NotificationResult> {
  const env = getServerEnv();
  const admin = createAdminSupabaseClient();
  const whatsappUrl = buildReservationWhatsAppUrl(reservation);
  const payload = {
    reservationId: reservation.id,
    customerName: reservation.customerName,
    phone: reservation.phone,
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.partySize,
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
    return {
      message: "Reserva guardada. No se pudo registrar la notificación.",
      customerName: reservation.customerName,
      whatsappUrl,
      provider: "wa_me",
    };
  }

  if (env.notificationProvider === "whatsapp_cloud") {
    try {
      await sendWhatsAppCloud(
        env.whatsappCloudOwnerPhone || env.whatsappBusinessNumber,
        env.whatsappCloudTemplateOwner,
        reservationText(reservation)
      );
      await sendWhatsAppCloud(
        `52${reservation.phone}`,
        env.whatsappCloudTemplateCustomer,
        `Tu reserva en El Cactus quedó confirmada el ${reservation.date} a las ${reservation.time}.`
      );
      await recordAttempt(outbox.id, "whatsapp_cloud", true, { ok: true });
      return {
        message: "Confirmación enviada por WhatsApp al cliente y al negocio.",
        customerName: reservation.customerName,
        whatsappUrl: null,
        provider: "whatsapp_cloud",
      };
    } catch (cloudError) {
      const details = cloudError instanceof Error ? cloudError.message : "cloud_error";
      await recordAttempt(outbox.id, "whatsapp_cloud", false, null, details);
      logEvent("warn", {
        message: "Cloud API falló; se usa wa.me de respaldo",
        code: "NOTIFY_CLOUD_FALLBACK",
      });
    }
  }

  await recordAttempt(outbox.id, "wa_me", true, { whatsappUrl });
  return {
    message: "Reserva guardada. Abre WhatsApp para avisar al negocio.",
    customerName: reservation.customerName,
    whatsappUrl,
    provider: "wa_me",
  };
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
