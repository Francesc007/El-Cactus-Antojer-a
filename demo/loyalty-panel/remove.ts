import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { LOYALTY_PHOTO_BUCKET } from "@/lib/loyalty";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DEMO_MANIFEST_PATH, DEMO_PRIVACY_TAG, LOYALTY_SETTINGS_BASELINE } from "./constants";

type Manifest = {
  memberIds: string[];
  photoPaths: string[];
};

function readManifest(): Manifest | null {
  const path = resolve(process.cwd(), DEMO_MANIFEST_PATH);
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}

export async function removeLoyaltyDemo(): Promise<void> {
  const admin = createAdminSupabaseClient();
  const manifest = readManifest();

  const { data: members, error: listError } = await admin
    .from("loyalty_members")
    .select("id, photo_path")
    .eq("privacy_notice_version", DEMO_PRIVACY_TAG);

  if (listError) {
    throw new Error(`No se pudo listar el demo: ${listError.message}`);
  }

  const rows = members ?? [];
  if (rows.length === 0 && !manifest) {
    console.log("No había datos demo que borrar.");
    return;
  }

  const photoPaths = new Set<string>(manifest?.photoPaths ?? []);
  for (const row of rows) {
    photoPaths.add(row.photo_path as string);
  }

  const memberIds = rows.map((row) => row.id as string);
  if (memberIds.length > 0) {
    const { data: messages } = await admin
      .from("birthday_messages")
      .select("outbox_id")
      .in("member_id", memberIds);
    const outboxIds = ((messages ?? []) as { outbox_id: string | null }[])
      .map((m) => m.outbox_id)
      .filter((id): id is string => Boolean(id));
    if (outboxIds.length > 0) {
      await admin.from("notification_outbox").delete().in("id", outboxIds);
    }

    const { error: deleteError } = await admin
      .from("loyalty_members")
      .delete()
      .eq("privacy_notice_version", DEMO_PRIVACY_TAG);
    if (deleteError) {
      throw new Error(`No se pudieron borrar las tarjetas demo: ${deleteError.message}`);
    }
  }

  if (photoPaths.size > 0) {
    await admin.storage.from(LOYALTY_PHOTO_BUCKET).remove([...photoPaths]);
  }

  const manifestPath = resolve(process.cwd(), DEMO_MANIFEST_PATH);
  const hadDemo = rows.length > 0 || manifest !== null;
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath);
  }

  if (hadDemo) {
    const b = LOYALTY_SETTINGS_BASELINE;
    await admin.from("loyalty_settings").upsert(
      {
        id: 1,
        visits_per_reward: b.visitsPerReward,
        reward_description: b.rewardDescription,
        min_hours_between_visits: b.minHoursBetweenVisits,
        birthday_message: b.birthdayMessage,
      },
      { onConflict: "id" }
    );
  }

  console.log(`Demo eliminado (${rows.length} clientes, ${photoPaths.size} fotos).`);
}
