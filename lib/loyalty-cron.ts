import { getServerEnv } from "@/lib/env";
import {
  BIRTHDAY_ATTEMPT_LIMIT,
  birthdayCronSendsMessages,
  birthdayMessageKey,
  birthdayOnDates,
  birthdayWeekKey,
  firstName,
  formatWeeklyNames,
  scrubSensitiveText,
  templateParameter,
  weekDatesMondayToSunday,
  zonedDate,
} from "@/lib/loyalty";
import { recordNotificationAttempt, sendWhatsAppTemplate } from "@/lib/notifications";
import { logEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type CronMember = {
  id: string;
  full_name: string;
  phone: string;
  birth_day: number;
  birth_month: number;
};

type BirthdayRow = {
  id: string;
  outbox_id: string | null;
  status: "pending" | "sent" | "failed";
  attempt_count: number;
};

type DeliveryInput = {
  key: string;
  memberId: string | null;
  year: number;
  to: string;
  template: string;
  parameters: string[];
  outboxType: "birthday" | "birthday_week";
  payload: Record<string, string | number>;
};

export type BirthdayCronResult = {
  provider: "wa_me" | "whatsapp_cloud";
  birthdaysSent: number;
  birthdaysFailed: number;
  birthdaysSkipped: number;
  weekly: "skipped" | "sent" | "failed" | "not_monday" | "empty";
};

async function loadMembers(): Promise<CronMember[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_members")
    .select("id, full_name, phone, birth_day, birth_month")
    .eq("status", "active")
    .eq("marketing_consent", true);

  if (error) {
    logEvent("error", { message: "No se pudo leer a los cumpleañeros", code: "BIRTHDAY_READ" });
    throw new Error("BIRTHDAY_READ");
  }
  return (data ?? []) as CronMember[];
}

async function loadOrCreate(input: DeliveryInput): Promise<BirthdayRow | null> {
  const admin = createAdminSupabaseClient();
  const { data: existing, error: readError } = await admin
    .from("birthday_messages")
    .select("id, outbox_id, status, attempt_count")
    .eq("idempotency_key", input.key)
    .maybeSingle();

  if (readError) {
    logEvent("error", { message: "No se pudo leer el aviso de cumpleaños", code: "BIRTHDAY_ROW" });
    return null;
  }
  if (existing) {
    return existing as BirthdayRow;
  }

  const { data, error } = await admin
    .from("birthday_messages")
    .insert({
      member_id: input.memberId,
      year: input.year,
      idempotency_key: input.key,
      status: "pending",
      attempt_count: 0,
    })
    .select("id, outbox_id, status, attempt_count")
    .maybeSingle();

  if (error?.code === "23505") {
    const { data: raced } = await admin
      .from("birthday_messages")
      .select("id, outbox_id, status, attempt_count")
      .eq("idempotency_key", input.key)
      .maybeSingle();
    return (raced as BirthdayRow | null) ?? null;
  }
  if (error || !data) {
    logEvent("error", { message: "No se pudo registrar el aviso de cumpleaños", code: "BIRTHDAY_ROW" });
    return null;
  }
  return data as BirthdayRow;
}

async function claim(row: BirthdayRow): Promise<BirthdayRow | null> {
  if (row.status === "sent" || row.attempt_count >= BIRTHDAY_ATTEMPT_LIMIT) {
    return null;
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("birthday_messages")
    .update({ attempt_count: row.attempt_count + 1, status: "pending" })
    .eq("id", row.id)
    .eq("attempt_count", row.attempt_count)
    .in("status", ["pending", "failed"])
    .select("id, outbox_id, status, attempt_count")
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as BirthdayRow;
}

async function ensureOutbox(row: BirthdayRow, input: DeliveryInput): Promise<string | null> {
  if (row.outbox_id) {
    return row.outbox_id;
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("notification_outbox")
    .insert({
      type: input.outboxType,
      channel: "whatsapp_cloud",
      payload: input.payload,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    logEvent("error", { message: "No se pudo guardar el aviso de cumpleaños", code: "BIRTHDAY_OUTBOX" });
    return null;
  }

  const outboxId = String((data as { id: string }).id);
  await admin.from("birthday_messages").update({ outbox_id: outboxId }).eq("id", row.id);
  return outboxId;
}

async function finish(rowId: string, outboxId: string, success: boolean, errorText?: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  await recordNotificationAttempt(
    outboxId,
    "whatsapp_cloud",
    success,
    success ? { ok: true } : null,
    errorText
  );
  await admin
    .from("birthday_messages")
    .update({
      status: success ? "sent" : "failed",
      sent_at: success ? new Date().toISOString() : null,
      outbox_id: outboxId,
    })
    .eq("id", rowId);
}

async function deliverOne(input: DeliveryInput): Promise<"sent" | "failed" | "skipped"> {
  const env = getServerEnv();
  if (!env.whatsappCloudToken || !env.whatsappCloudPhoneNumberId || !input.template || !input.to) {
    logEvent("warn", {
      message: "El cumpleaños automático no tiene plantilla o teléfono de destino",
      code: "BIRTHDAY_TEMPLATE",
    });
    return "failed";
  }
  if (input.parameters.some((parameter) => parameter.length === 0)) {
    return "failed";
  }

  const row = await loadOrCreate(input);
  if (!row) {
    return "failed";
  }
  const claimed = await claim(row);
  if (!claimed) {
    return "skipped";
  }

  const outboxId = await ensureOutbox(claimed, input);
  if (!outboxId) {
    return "failed";
  }

  try {
    await sendWhatsAppTemplate(input.to, input.template, input.parameters);
    await finish(claimed.id, outboxId, true);
    return "sent";
  } catch (error) {
    const details = scrubSensitiveText(error instanceof Error ? error.message : "cloud_error");
    await finish(claimed.id, outboxId, false, details);
    return "failed";
  }
}

export async function runBirthdayCron(now = new Date()): Promise<BirthdayCronResult> {
  const env = getServerEnv();
  if (!birthdayCronSendsMessages(env.notificationProvider)) {
    return {
      provider: "wa_me",
      birthdaysSent: 0,
      birthdaysFailed: 0,
      birthdaysSkipped: 0,
      weekly: "skipped",
    };
  }

  const today = zonedDate(now, env.businessTimezone);
  const members = await loadMembers();
  let birthdaysSent = 0;
  let birthdaysFailed = 0;
  let birthdaysSkipped = 0;

  for (const member of members) {
    if (!birthdayOnDates(member.birth_month, member.birth_day, [today])) {
      continue;
    }
    try {
      const outcome = await deliverOne({
        key: birthdayMessageKey(member.id, today.year),
        memberId: member.id,
        year: today.year,
        to: member.phone,
        template: env.whatsappCloudTemplateBirthday,
        parameters: [templateParameter(firstName(member.full_name))],
        outboxType: "birthday",
        payload: {
          memberId: member.id,
          firstName: firstName(member.full_name),
          year: today.year,
        },
      });
      if (outcome === "sent") {
        birthdaysSent += 1;
      } else if (outcome === "failed") {
        birthdaysFailed += 1;
      } else {
        birthdaysSkipped += 1;
      }
    } catch {
      birthdaysFailed += 1;
      logEvent("error", { message: "Fallo al enviar una felicitación", code: "BIRTHDAY_SEND" });
    }
  }

  let weekly: BirthdayCronResult["weekly"] = "not_monday";
  if (today.weekday === 1) {
    const celebrating = members.filter(
      (member) => birthdayOnDates(member.birth_month, member.birth_day, weekDatesMondayToSunday(today))
    );
    if (celebrating.length === 0) {
      weekly = "empty";
    } else {
      const owner = (env.whatsappCloudOwnerPhone || env.whatsappBusinessNumber).replace(/\D/g, "");
      try {
        const outcome = await deliverOne({
          key: birthdayWeekKey(today),
          memberId: null,
          year: today.year,
          to: owner,
          template: env.whatsappCloudTemplateBirthdayWeekly,
          parameters: [
            String(celebrating.length),
            templateParameter(formatWeeklyNames(celebrating.map((member) => firstName(member.full_name)))),
          ],
          outboxType: "birthday_week",
          payload: {
            count: celebrating.length,
            names: formatWeeklyNames(celebrating.map((member) => firstName(member.full_name))),
          },
        });
        weekly = outcome === "sent" ? "sent" : outcome === "failed" ? "failed" : "skipped";
      } catch {
        weekly = "failed";
        logEvent("error", { message: "Fallo el aviso semanal de cumpleaños", code: "BIRTHDAY_WEEK" });
      }
    }
  }

  return {
    provider: "whatsapp_cloud",
    birthdaysSent,
    birthdaysFailed,
    birthdaysSkipped,
    weekly,
  };
}
