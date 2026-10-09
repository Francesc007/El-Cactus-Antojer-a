import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { LOYALTY_PHOTO_BUCKET } from "@/lib/loyalty";
import { zonedDate, type ZonedDate } from "@/lib/loyalty";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  DEMO_LOYALTY_SETTINGS,
  DEMO_MANIFEST_PATH,
  DEMO_MEMBERS,
  DEMO_PHONE_PREFIX,
  DEMO_PRIVACY_TAG,
  type DemoMemberSpec,
} from "./constants";
import { tinyJpegBytes } from "./tiny-jpeg";

type Manifest = {
  memberIds: string[];
  photoPaths: string[];
  seededAt: string;
};

function phone(spec: DemoMemberSpec): string {
  return `${DEMO_PHONE_PREFIX}${spec.phoneSuffix}`;
}

function applyBirthdayOverrides(spec: DemoMemberSpec, today: ZonedDate): DemoMemberSpec {
  if (spec.id === "a1000007-0001-4001-8001-000000000007") {
    return { ...spec, birthDay: today.day, birthMonth: today.month };
  }
  if (spec.id === "a1000003-0001-4001-8001-000000000003") {
    const inThree = new Date(Date.UTC(today.year, today.month - 1, today.day));
    inThree.setUTCDate(inThree.getUTCDate() + 3);
    return {
      ...spec,
      birthDay: inThree.getUTCDate(),
      birthMonth: inThree.getUTCMonth() + 1,
    };
  }
  if (spec.id === "a1000001-0001-4001-8001-000000000001") {
    const inWeek = new Date(Date.UTC(today.year, today.month - 1, today.day));
    inWeek.setUTCDate(inWeek.getUTCDate() + 2);
    return {
      ...spec,
      birthDay: inWeek.getUTCDate(),
      birthMonth: inWeek.getUTCMonth() + 1,
    };
  }
  return spec;
}

async function ensureNotAlreadySeeded(): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_members")
    .select("id")
    .eq("privacy_notice_version", DEMO_PRIVACY_TAG)
    .limit(1);
  if (error) {
    throw new Error(`No se pudo revisar el demo: ${error.message}`);
  }
  if (data && data.length > 0) {
    throw new Error(
      "Ya hay datos demo. Ejecuta primero: npm run demo:loyalty:remove"
    );
  }
}

export async function seedLoyaltyDemo(): Promise<void> {
  await ensureNotAlreadySeeded();

  const admin = createAdminSupabaseClient();
  const today = zonedDate(new Date(), process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City");
  const jpeg = tinyJpegBytes();
  const manifest: Manifest = { memberIds: [], photoPaths: [], seededAt: new Date().toISOString() };

  const specs = DEMO_MEMBERS.map((spec) => applyBirthdayOverrides(spec, today));

  for (const spec of specs) {
    const photoPath = `${spec.photoId}.jpg`;
    const { error: uploadError } = await admin.storage.from(LOYALTY_PHOTO_BUCKET).upload(photoPath, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (uploadError) {
      throw new Error(`No se pudo subir la foto demo (${spec.folio}): ${uploadError.message}`);
    }
    manifest.photoPaths.push(photoPath);

    const { error: insertError } = await admin.from("loyalty_members").insert({
      id: spec.id,
      member_code: spec.memberCode,
      folio: spec.folio,
      full_name: spec.fullName,
      phone: phone(spec),
      birth_day: spec.birthDay,
      birth_month: spec.birthMonth,
      birth_year: spec.birthYear,
      photo_path: photoPath,
      marketing_consent: true,
      consent_at: new Date().toISOString(),
      privacy_notice_version: DEMO_PRIVACY_TAG,
      status: spec.status,
    });
    if (insertError) {
      throw new Error(`No se pudo crear ${spec.fullName}: ${insertError.message}`);
    }
    manifest.memberIds.push(spec.id);

    if (!spec.marketingConsentAfterSeed) {
      await admin.from("loyalty_members").update({ marketing_consent: false }).eq("id", spec.id);
    }
  }

  await seedVisitsAndRedemptions(admin, specs, today.year);
  await applyDemoLoyaltySettings(admin);

  const manifestPath = resolve(process.cwd(), DEMO_MANIFEST_PATH);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("Demo de clientes VIP creado.");
  console.log(`Tarjetas públicas (QR): /tarjeta/<código>`);
  for (const spec of specs) {
    console.log(`  ${spec.folio} ${spec.fullName} → /tarjeta/${spec.folio}`);
  }
  console.log(`Para quitar todo: npm run demo:loyalty:remove`);
}

export async function applyDemoLoyaltySettingsOnly(): Promise<void> {
  const admin = createAdminSupabaseClient();
  await applyDemoLoyaltySettings(admin);
  console.log("Configuración demo de tarjeta VIP guardada (visitas, premio, horas y mensaje).");
}

async function applyDemoLoyaltySettings(admin: ReturnType<typeof createAdminSupabaseClient>): Promise<void> {
  const s = DEMO_LOYALTY_SETTINGS;
  const { error } = await admin.from("loyalty_settings").upsert(
    {
      id: 1,
      visits_per_reward: s.visitsPerReward,
      reward_description: s.rewardDescription,
      min_hours_between_visits: s.minHoursBetweenVisits,
      birthday_message: s.birthdayMessage,
    },
    { onConflict: "id" }
  );
  if (error) {
    throw new Error(`No se pudo aplicar la configuración demo: ${error.message}`);
  }
}

async function seedVisitsAndRedemptions(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  specs: DemoMemberSpec[],
  year: number
): Promise<void> {
  const maria = specs.find((s) => s.folio === "C-9001")!.id;
  const luis = specs.find((s) => s.folio === "C-9002")!.id;
  const patricia = specs.find((s) => s.folio === "C-9005")!.id;
  const roberto = specs.find((s) => s.folio === "C-9006")!.id;
  const sofia = specs.find((s) => s.folio === "C-9007")!.id;

  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  async function visits(memberId: string, count: number, source: "scan" | "manual" = "scan") {
    for (let i = 0; i < count; i++) {
      await admin.from("loyalty_visits").insert({
        member_id: memberId,
        visited_at: daysAgo(14 - i * 2),
        source,
      });
    }
  }

  await visits(maria, 4);
  await visits(luis, 5);
  await visits(patricia, 3);
  const { data: staffProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .in("role", ["owner", "staff"])
    .limit(1)
    .maybeSingle();
  const voidedBy = staffProfile?.id ?? null;
  if (voidedBy) {
    await admin.from("loyalty_visits").insert({
      member_id: patricia,
      visited_at: daysAgo(20),
      source: "manual",
      voided_at: daysAgo(19),
      voided_by: voidedBy,
      void_reason: "Demo: visita duplicada por error",
    });
  }

  await visits(roberto, 7);
  await admin.from("loyalty_redemptions").insert({
    member_id: roberto,
    redeemed_at: daysAgo(3),
    visits_consumed: 5,
  });

  await visits(sofia, 1);
  await visits(specs.find((s) => s.folio === "C-9008")!.id, 3);
  await visits(specs.find((s) => s.folio === "C-9004")!.id, 2, "manual");

  await admin.from("birthday_messages").insert({
    member_id: sofia,
    year,
    idempotency_key: `birthday:${sofia}:${year}`,
    status: "sent",
    sent_at: new Date().toISOString(),
  });
}
