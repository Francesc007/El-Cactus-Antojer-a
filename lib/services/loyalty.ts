import { AppError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env";
import {
  birthdayMessageKey,
  birthdayOnDates,
  birthdayWaMeUrl,
  composeBirthdayMessage,
  currentCardVisits,
  detectLoyaltyImage,
  displayedCardVisits,
  firstName,
  formatBusinessDateTime,
  formatSpanishDay,
  isRewardAvailable,
  isValidBirthDate,
  isVisitTooSoon,
  visitsUntilReward,
  loyaltyCardUrl,
  loyaltyPhotoPath,
  LOYALTY_PHOTO_BUCKET,
  LOYALTY_PHOTO_SIGNED_SECONDS,
  normalizeFullName,
  normalizeLoyaltyPhone,
  normalizeMemberCode,
  parseLoyaltyCardSlug,
  PRIVACY_NOTICE_VERSION,
  upcomingDates,
  weekDatesMondayToSunday,
  zonedDate,
  type CalendarDate,
} from "@/lib/loyalty";
import { logEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { supabaseFetch } from "@/lib/supabase/fetch";
import type {
  BirthdayBoard,
  BirthdayEntry,
  BirthdaySendStatus,
  LoyaltyListItem,
  LoyaltyMemberDetail,
  LoyaltyPreview,
  LoyaltyRedemptionRecord,
  LoyaltySettingsView,
  LoyaltyStatus,
  LoyaltyVisitRecord,
  LoyaltyVisitSource,
  PublicLoyaltyCard,
  UpdateLoyaltyMemberInput,
} from "@/lib/types";


type DbError = {
  code?: string;
  message?: string;
};

type MemberRow = {
  id: string;
  member_code: string;
  folio: string;
  full_name: string;
  phone: string;
  birth_day: number;
  birth_month: number;
  birth_year: number | null;
  photo_path: string;
  marketing_consent: boolean;
  status: LoyaltyStatus;
  created_at: string;
};

type ProgressRow = {
  member_id: string;
  valid_visits: number;
  visits_consumed: number;
  last_valid_visit_at: string | null;
};

type SettingsRow = {
  visits_per_reward: number;
  reward_description: string;
  min_hours_between_visits: number;
  birthday_message: string;
};

type VisitRow = {
  id: string;
  visited_at: string;
  source: LoyaltyVisitSource;
  voided_at: string | null;
  void_reason: string | null;
};

type RedemptionRow = {
  id: string;
  redeemed_at: string;
  visits_consumed: number;
};

type BirthdayMemberRow = {
  id: string;
  full_name: string;
  folio: string;
  phone: string;
  photo_path: string;
  birth_day: number;
  birth_month: number;
};

function timezone(): string {
  return getServerEnv().businessTimezone;
}

function isPhoneTaken(error: DbError): boolean {
  return error.code === "23505" && (error.message ?? "").includes("loyalty_members_phone_unique");
}

function throwRpc(error: DbError): never {
  const message = error.message ?? "";
  if (message.includes("MEMBER_NOT_FOUND") || message.includes("VISIT_NOT_FOUND")) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }
  if (message.includes("MEMBER_INACTIVE")) {
    throw new AppError("Esta tarjeta está inactiva.", "MEMBER_INACTIVE", 409);
  }
  if (message.includes("VISIT_TOO_SOON")) {
    throw new AppError(
      "La última visita fue hace muy poco. Puedes registrarla de todos modos si el cliente ya volvió.",
      "VISIT_TOO_SOON",
      409
    );
  }
  if (message.includes("REWARD_NOT_AVAILABLE")) {
    throw new AppError("Todavía no junta las visitas del premio.", "REWARD_NOT_AVAILABLE", 409);
  }
  if (message.includes("VISIT_ALREADY_VOID")) {
    throw new AppError("Esa visita ya estaba anulada.", "VISIT_ALREADY_VOID", 409);
  }
  if (message.includes("VOID_REASON_REQUIRED")) {
    throw new AppError("Escribe el motivo de la anulación.", "VOID_REASON_REQUIRED", 400);
  }
  logEvent("error", { message: "No se pudo completar la acción de la tarjeta", code: "LOYALTY_RPC" });
  throw new AppError("No se pudo completar la acción.", "LOYALTY_RPC", 500);
}

async function loadSettings(): Promise<SettingsRow> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_settings")
    .select("visits_per_reward, reward_description, min_hours_between_visits, birthday_message")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("No está configurada la tarjeta VIP.", "SETTINGS_MISSING", 500);
  }
  return data as SettingsRow;
}

async function loadProgress(memberIds: string[]): Promise<Map<string, ProgressRow>> {
  const map = new Map<string, ProgressRow>();
  if (memberIds.length === 0) {
    return map;
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_member_progress")
    .select("member_id, valid_visits, visits_consumed, last_valid_visit_at")
    .in("member_id", memberIds);

  if (error) {
    logEvent("error", { message: "No se pudo leer el avance de las tarjetas", code: "LOYALTY_PROGRESS" });
    throw new AppError("No se pudo leer el avance de las tarjetas.", "LOYALTY_PROGRESS", 500);
  }

  for (const row of (data ?? []) as ProgressRow[]) {
    map.set(row.member_id, {
      member_id: row.member_id,
      valid_visits: Number(row.valid_visits),
      visits_consumed: Number(row.visits_consumed),
      last_valid_visit_at: row.last_valid_visit_at,
    });
  }
  return map;
}

const PHOTO_SIGN_MARKER = "/storage/v1/object/sign/";

let photoThumbsEnabled: boolean | null = null;

async function signPhotos(paths: string[]): Promise<Map<string, string>> {
  const originals = await createPhotoUrls(paths);
  if (photoThumbsEnabled === false || originals.size === 0) {
    return originals;
  }

  const thumbs = new Map<string, string>();
  for (const [path, url] of originals) {
    const thumb = photoThumbUrl(url);
    if (!thumb) {
      photoThumbsEnabled = false;
      return originals;
    }
    thumbs.set(path, thumb);
  }

  if (photoThumbsEnabled === null) {
    const sample = thumbs.values().next().value;
    photoThumbsEnabled = sample ? await photoThumbResponds(sample) : false;
  }

  return photoThumbsEnabled ? thumbs : originals;
}

async function createPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((path) => path.length > 0))];
  const map = new Map<string, string>();
  if (unique.length === 0) {
    return map;
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(LOYALTY_PHOTO_BUCKET)
    .createSignedUrls(unique, LOYALTY_PHOTO_SIGNED_SECONDS);

  if (error || !data) {
    return map;
  }

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}

/** Versión chica para la pantalla. Si el servicio no la ofrece, se usa el archivo original. */
function photoThumbUrl(signedUrl: string): string | null {
  const index = signedUrl.indexOf(PHOTO_SIGN_MARKER);
  if (index === -1) {
    return null;
  }
  const rewritten =
    signedUrl.slice(0, index) +
    "/storage/v1/render/image/sign/" +
    signedUrl.slice(index + PHOTO_SIGN_MARKER.length);
  try {
    const url = new URL(rewritten);
    url.searchParams.set("width", "512");
    url.searchParams.set("height", "512");
    url.searchParams.set("resize", "cover");
    url.searchParams.set("quality", "75");
    return url.toString();
  } catch {
    return null;
  }
}

async function photoThumbResponds(url: string): Promise<boolean> {
  try {
    const response = await supabaseFetch(url, { headers: { Range: "bytes=0-64" } });
    if (!(response.ok || response.status === 206)) {
      return false;
    }
    const type = response.headers.get("content-type") ?? "";
    return !type.includes("json") && !type.startsWith("text/");
  } catch {
    return false;
  }
}

function progressOf(map: Map<string, ProgressRow>, memberId: string): ProgressRow {
  return (
    map.get(memberId) ?? {
      member_id: memberId,
      valid_visits: 0,
      visits_consumed: 0,
      last_valid_visit_at: null,
    }
  );
}

function safeSearch(value: string): string {
  return value
    .trim()
    .replace(/[%_,().*]/g, "")
    .slice(0, 40);
}

async function removePhoto(path: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.storage.from(LOYALTY_PHOTO_BUCKET).remove([path]);
  if (error) {
    logEvent("error", { message: "No se pudo borrar la foto de la tarjeta", code: "PHOTO_DELETE" });
  }
}

export async function createLoyaltyMember(input: {
  fullName: string;
  phoneRaw: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  photo: Uint8Array;
  consent: boolean;
}): Promise<{ folio: string }> {
  if (!input.consent) {
    throw new AppError(
      "Para generar la tarjeta hay que aceptar los mensajes.",
      "CONSENT_REQUIRED",
      400
    );
  }

  const fullName = normalizeFullName(input.fullName);
  if (!fullName) {
    throw new AppError("Escribe el nombre completo.", "VALIDATION", 400);
  }

  const phone = normalizeLoyaltyPhone(input.phoneRaw);
  if (!phone) {
    throw new AppError(
      "El teléfono debe tener 10 dígitos. Puedes escribirlo con espacios o con 52 al inicio.",
      "VALIDATION",
      400
    );
  }

  if (!isValidBirthDate(input.birthMonth, input.birthDay, input.birthYear)) {
    throw new AppError("Revisa el día y el mes de nacimiento.", "VALIDATION", 400);
  }

  const kind = detectLoyaltyImage(input.photo);
  if (!kind) {
    throw new AppError(
      "La foto debe ser JPEG, PNG o WebP y pesar menos de 2 MB.",
      "INVALID_PHOTO",
      400
    );
  }

  const admin = createAdminSupabaseClient();
  const path = loyaltyPhotoPath(crypto.randomUUID(), kind.extension);
  const { error: uploadError } = await admin.storage.from(LOYALTY_PHOTO_BUCKET).upload(path, input.photo, {
    contentType: kind.mime,
    upsert: false,
  });

  if (uploadError) {
    logEvent("error", { message: "No se pudo guardar la foto de la tarjeta", code: "PHOTO_UPLOAD" });
    throw new AppError("No se pudo guardar la foto.", "PHOTO_UPLOAD", 500);
  }

  const { data, error } = await admin
    .from("loyalty_members")
    .insert({
      full_name: fullName,
      phone,
      birth_day: input.birthDay,
      birth_month: input.birthMonth,
      birth_year: input.birthYear,
      photo_path: path,
      marketing_consent: true,
      privacy_notice_version: PRIVACY_NOTICE_VERSION,
      status: "active",
    })
    .select("folio")
    .single();

  if (error || !data) {
    await removePhoto(path);
    if (error && isPhoneTaken(error)) {
      throw new AppError(
        "Este número ya está registrado. Si necesitas tu tarjeta, pídela en el negocio.",
        "PHONE_TAKEN",
        409
      );
    }
    if (error?.message?.includes("CONSENT_REQUIRED")) {
      throw new AppError(
        "Para generar la tarjeta hay que aceptar los mensajes.",
        "CONSENT_REQUIRED",
        400
      );
    }
    logEvent("error", { message: "No se pudo crear la tarjeta", code: "LOYALTY_CREATE" });
    throw new AppError("No se pudo crear la tarjeta.", "LOYALTY_CREATE", 500);
  }

  const folio = String((data as { folio: string }).folio ?? "").trim();
  if (!folio) {
    throw new AppError("No se pudo crear la tarjeta.", "LOYALTY_CREATE", 500);
  }
  return { folio };
}

export async function searchLoyaltyMembers(query: string): Promise<LoyaltyListItem[]> {
  const admin = createAdminSupabaseClient();
  const settings = await loadSettings();
  const phone = normalizeLoyaltyPhone(query);
  const text = safeSearch(query);

  let request = admin
    .from("loyalty_members")
    .select("id, full_name, folio, phone, photo_path, status, created_at")
    .order("created_at", { ascending: false })
    .limit(40);

  if (text || phone) {
    const filters = [
      text ? `full_name.ilike.%${text}%` : "",
      text ? `folio.ilike.%${text}%` : "",
      phone ? `phone.eq.${phone}` : "",
    ].filter((filter) => filter.length > 0);
    request = request.or(filters.join(","));
  }

  const { data, error } = await request;
  if (error) {
    logEvent("error", { message: "No se pudo buscar tarjetas", code: "LOYALTY_SEARCH" });
    throw new AppError("No se pudo buscar a los clientes.", "LOYALTY_SEARCH", 500);
  }

  const rows = (data ?? []) as MemberRow[];
  const progress = await loadProgress(rows.map((row) => row.id));
  const photos = await signPhotos(rows.map((row) => row.photo_path));

  return rows.map((row) => {
    const card = progressOf(progress, row.id);
    const current = currentCardVisits(card.valid_visits, card.visits_consumed);
    return {
      id: row.id,
      fullName: row.full_name,
      folio: row.folio,
      phone: row.phone,
      photoUrl: photos.get(row.photo_path) ?? null,
      currentVisits: displayedCardVisits(card.valid_visits, card.visits_consumed),
      visitsPerReward: settings.visits_per_reward,
      status: row.status,
      rewardAvailable: isRewardAvailable(current, settings.visits_per_reward),
    };
  });
}

async function loadMemberByCardSlug(slug: string): Promise<MemberRow | null> {
  const parsed = parseLoyaltyCardSlug(slug);
  if (!parsed) {
    return null;
  }
  const memberCode = normalizeMemberCode(parsed);
  if (memberCode) {
    return loadMemberBy("member_code", memberCode);
  }
  return loadMemberBy("folio", parsed);
}

async function loadMemberBy(column: "id" | "member_code" | "phone" | "folio", value: string): Promise<MemberRow | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_members")
    .select(
      "id, member_code, folio, full_name, phone, birth_day, birth_month, birth_year, photo_path, marketing_consent, status, created_at"
    )
    .eq(column, value)
    .maybeSingle();

  if (error) {
    logEvent("error", { message: "No se pudo leer la tarjeta", code: "LOYALTY_READ" });
    throw new AppError("No se pudo leer la tarjeta.", "LOYALTY_READ", 500);
  }
  return (data as MemberRow | null) ?? null;
}

function toPreview(
  member: MemberRow,
  progress: ProgressRow,
  settings: SettingsRow,
  photoUrl: string | null,
  now: Date
): LoyaltyPreview {
  const current = currentCardVisits(progress.valid_visits, progress.visits_consumed);
  return {
    id: member.id,
    fullName: member.full_name,
    folio: member.folio,
    photoUrl,
    currentVisits: displayedCardVisits(progress.valid_visits, progress.visits_consumed),
    visitsPerReward: settings.visits_per_reward,
    rewardDescription: settings.reward_description,
    rewardAvailable: isRewardAvailable(current, settings.visits_per_reward),
    visitsUntilReward: visitsUntilReward(current, settings.visits_per_reward),
    tooSoon: isVisitTooSoon(progress.last_valid_visit_at, settings.min_hours_between_visits, now),
    minHours: settings.min_hours_between_visits,
    status: member.status,
  };
}

export async function getLoyaltyPreviewByCode(code: string, now = new Date()): Promise<LoyaltyPreview> {
  if (!parseLoyaltyCardSlug(code)) {
    throw new AppError("Ese enlace no corresponde a una tarjeta VIP.", "VALIDATION", 400);
  }
  const member = await loadMemberByCardSlug(code);
  if (!member) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }
  return buildPreview(member, now);
}

export async function getLoyaltyPreviewByPhone(phoneRaw: string, now = new Date()): Promise<LoyaltyPreview> {
  const phone = normalizeLoyaltyPhone(phoneRaw);
  if (!phone) {
    throw new AppError(
      "El teléfono debe tener 10 dígitos. Puedes escribirlo con espacios o con 52 al inicio.",
      "VALIDATION",
      400
    );
  }
  const member = await loadMemberBy("phone", phone);
  if (!member) {
    throw new AppError("No hay una tarjeta con ese número.", "NOT_FOUND", 404);
  }
  return buildPreview(member, now);
}

async function buildPreview(member: MemberRow, now: Date): Promise<LoyaltyPreview> {
  const [progress, settings, photos] = await Promise.all([
    loadProgress([member.id]),
    loadSettings(),
    signPhotos([member.photo_path]),
  ]);
  return toPreview(member, progressOf(progress, member.id), settings, photos.get(member.photo_path) ?? null, now);
}

export async function getPublicLoyaltyCard(code: string): Promise<PublicLoyaltyCard | null> {
  if (!parseLoyaltyCardSlug(code)) {
    return null;
  }
  const member = await loadMemberByCardSlug(code);
  if (!member) {
    return null;
  }
  const [progress, settings, photos] = await Promise.all([
    loadProgress([member.id]),
    loadSettings(),
    signPhotos([member.photo_path]),
  ]);
  const card = progressOf(progress, member.id);
  const current = currentCardVisits(card.valid_visits, card.visits_consumed);
  return {
    firstName: firstName(member.full_name),
    folio: member.folio,
    phone: member.phone,
    photoUrl: photos.get(member.photo_path) ?? null,
    currentVisits: displayedCardVisits(card.valid_visits, card.visits_consumed),
    visitsPerReward: settings.visits_per_reward,
    rewardDescription: settings.reward_description,
    rewardAvailable: isRewardAvailable(current, settings.visits_per_reward),
    visitsUntilReward: visitsUntilReward(current, settings.visits_per_reward),
    cardUrl: loyaltyCardUrl(getServerEnv().appUrl, member.folio),
  };
}

export async function readPublicLoyaltyPhoto(
  code: string
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!parseLoyaltyCardSlug(code)) {
    return null;
  }
  const member = await loadMemberByCardSlug(code);
  if (!member) {
    return null;
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage.from(LOYALTY_PHOTO_BUCKET).download(member.photo_path);
  if (error || !data) {
    return null;
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  const kind = detectLoyaltyImage(bytes);
  if (!kind) {
    return null;
  }
  return { bytes, mime: kind.mime };
}

export async function getLoyaltyMemberDetail(id: string, now = new Date()): Promise<LoyaltyMemberDetail> {
  const member = await loadMemberBy("id", id);
  if (!member) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }

  const admin = createAdminSupabaseClient();
  const [progressMap, settings, photos, visitsResult, redemptionsResult] = await Promise.all([
    loadProgress([member.id]),
    loadSettings(),
    signPhotos([member.photo_path]),
    admin
      .from("loyalty_visits")
      .select("id, visited_at, source, voided_at, void_reason")
      .eq("member_id", member.id)
      .order("visited_at", { ascending: false }),
    admin
      .from("loyalty_redemptions")
      .select("id, redeemed_at, visits_consumed")
      .eq("member_id", member.id)
      .order("redeemed_at", { ascending: false }),
  ]);

  if (visitsResult.error || redemptionsResult.error) {
    logEvent("error", { message: "No se pudo leer el historial de la tarjeta", code: "LOYALTY_HISTORY" });
    throw new AppError("No se pudo leer el historial.", "LOYALTY_HISTORY", 500);
  }

  const zone = timezone();
  const progress = progressOf(progressMap, member.id);
  const current = currentCardVisits(progress.valid_visits, progress.visits_consumed);
  const visits: LoyaltyVisitRecord[] = ((visitsResult.data ?? []) as VisitRow[]).map((visit) => ({
    id: visit.id,
    visitedAtLabel: formatBusinessDateTime(visit.visited_at, zone),
    source: visit.source,
    voided: visit.voided_at !== null,
    voidReason: visit.void_reason,
  }));
  const redemptions: LoyaltyRedemptionRecord[] = ((redemptionsResult.data ?? []) as RedemptionRow[]).map(
    (redemption) => ({
      id: redemption.id,
      redeemedAtLabel: formatBusinessDateTime(redemption.redeemed_at, zone),
      visitsConsumed: redemption.visits_consumed,
    })
  );

  return {
    id: member.id,
    fullName: member.full_name,
    folio: member.folio,
    phone: member.phone,
    cardUrl: loyaltyCardUrl(getServerEnv().appUrl, member.folio),
    birthDay: member.birth_day,
    birthMonth: member.birth_month,
    birthYear: member.birth_year,
    photoUrl: photos.get(member.photo_path) ?? null,
    marketingConsent: member.marketing_consent,
    status: member.status,
    currentVisits: displayedCardVisits(progress.valid_visits, progress.visits_consumed),
    visitsPerReward: settings.visits_per_reward,
    rewardDescription: settings.reward_description,
    rewardAvailable: isRewardAvailable(current, settings.visits_per_reward),
    visitsUntilReward: visitsUntilReward(current, settings.visits_per_reward),
    tooSoon: isVisitTooSoon(progress.last_valid_visit_at, settings.min_hours_between_visits, now),
    minHours: settings.min_hours_between_visits,
    visits,
    redemptions,
  };
}

export async function updateLoyaltyMember(id: string, input: UpdateLoyaltyMemberInput): Promise<void> {
  const member = await loadMemberBy("id", id);
  if (!member) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }

  const fullName = input.fullName === undefined ? member.full_name : normalizeFullName(input.fullName);
  if (!fullName) {
    throw new AppError("Escribe el nombre completo.", "VALIDATION", 400);
  }

  const phone = input.phone === undefined ? member.phone : normalizeLoyaltyPhone(input.phone);
  if (!phone) {
    throw new AppError(
      "El teléfono debe tener 10 dígitos. Puedes escribirlo con espacios o con 52 al inicio.",
      "VALIDATION",
      400
    );
  }

  const birthDay = input.birthDay ?? member.birth_day;
  const birthMonth = input.birthMonth ?? member.birth_month;
  const birthYear = input.birthYear === undefined ? member.birth_year : input.birthYear;
  if (!isValidBirthDate(birthMonth, birthDay, birthYear)) {
    throw new AppError("Revisa el día y el mes de nacimiento.", "VALIDATION", 400);
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("loyalty_members")
    .update({
      full_name: fullName,
      phone,
      birth_day: birthDay,
      birth_month: birthMonth,
      birth_year: birthYear,
      status: input.status ?? member.status,
      marketing_consent: input.marketingConsent ?? member.marketing_consent,
    })
    .eq("id", id);

  if (error) {
    if (isPhoneTaken(error)) {
      throw new AppError(
        "Este número ya está registrado. Si necesitas tu tarjeta, pídela en el negocio.",
        "PHONE_TAKEN",
        409
      );
    }
    logEvent("error", { message: "No se pudo actualizar la tarjeta", code: "LOYALTY_UPDATE" });
    throw new AppError("No se pudo actualizar la tarjeta.", "LOYALTY_UPDATE", 500);
  }
}

export async function withdrawMarketingConsent(id: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_members")
    .update({ marketing_consent: false })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }
}

export async function replaceLoyaltyPhoto(id: string, photo: Uint8Array): Promise<void> {
  const member = await loadMemberBy("id", id);
  if (!member) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }
  const kind = detectLoyaltyImage(photo);
  if (!kind) {
    throw new AppError(
      "La foto debe ser JPEG, PNG o WebP y pesar menos de 2 MB.",
      "INVALID_PHOTO",
      400
    );
  }

  const admin = createAdminSupabaseClient();
  const path = loyaltyPhotoPath(crypto.randomUUID(), kind.extension);
  const { error: uploadError } = await admin.storage.from(LOYALTY_PHOTO_BUCKET).upload(path, photo, {
    contentType: kind.mime,
    upsert: false,
  });
  if (uploadError) {
    logEvent("error", { message: "No se pudo guardar la foto de la tarjeta", code: "PHOTO_UPLOAD" });
    throw new AppError("No se pudo guardar la foto.", "PHOTO_UPLOAD", 500);
  }

  const { error } = await admin.from("loyalty_members").update({ photo_path: path }).eq("id", id);
  if (error) {
    await removePhoto(path);
    logEvent("error", { message: "No se pudo actualizar la foto de la tarjeta", code: "PHOTO_UPDATE" });
    throw new AppError("No se pudo actualizar la foto.", "PHOTO_UPDATE", 500);
  }

  await removePhoto(member.photo_path);
}

export async function deleteLoyaltyMember(id: string): Promise<void> {
  const member = await loadMemberBy("id", id);
  if (!member) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }

  const admin = createAdminSupabaseClient();
  const { data: messages, error: messageError } = await admin
    .from("birthday_messages")
    .select("outbox_id")
    .eq("member_id", id);

  if (messageError) {
    logEvent("error", { message: "No se pudieron leer los avisos de cumpleaños", code: "BIRTHDAY_READ" });
    throw new AppError("No se pudo eliminar la tarjeta.", "LOYALTY_DELETE", 500);
  }

  const outboxIds = ((messages ?? []) as { outbox_id: string | null }[])
    .map((message) => message.outbox_id)
    .filter((outboxId): outboxId is string => Boolean(outboxId));

  if (outboxIds.length > 0) {
    const { error: outboxError } = await admin.from("notification_outbox").delete().in("id", outboxIds);
    if (outboxError) {
      logEvent("error", { message: "No se pudieron borrar los avisos de cumpleaños", code: "BIRTHDAY_DELETE" });
      throw new AppError("No se pudo eliminar la tarjeta.", "LOYALTY_DELETE", 500);
    }
  }

  const { error } = await admin.from("loyalty_members").delete().eq("id", id);
  if (error) {
    logEvent("error", { message: "No se pudo eliminar la tarjeta", code: "LOYALTY_DELETE" });
    throw new AppError("No se pudo eliminar la tarjeta.", "LOYALTY_DELETE", 500);
  }

  await removePhoto(member.photo_path);
}

export async function registerLoyaltyVisit(
  memberId: string,
  staffId: string,
  source: LoyaltyVisitSource,
  force: boolean
): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc("register_loyalty_visit", {
    p_member_id: memberId,
    p_registered_by: staffId,
    p_source: source,
    p_force: force,
  });
  if (error) {
    throwRpc(error);
  }
}

export async function redeemLoyaltyReward(memberId: string, staffId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc("redeem_loyalty_reward", {
    p_member_id: memberId,
    p_redeemed_by: staffId,
  });
  if (error) {
    throwRpc(error);
  }
}

export async function voidLoyaltyVisit(visitId: string, staffId: string, reason: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc("void_loyalty_visit", {
    p_visit_id: visitId,
    p_voided_by: staffId,
    p_reason: reason,
  });
  if (error) {
    throwRpc(error);
  }
}

export async function getLoyaltySettings(): Promise<LoyaltySettingsView> {
  const settings = await loadSettings();
  return {
    visitsPerReward: settings.visits_per_reward,
    rewardDescription: settings.reward_description,
    minHoursBetweenVisits: settings.min_hours_between_visits,
    birthdayMessage: settings.birthday_message,
  };
}

export async function updateLoyaltySettings(input: LoyaltySettingsView): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_settings")
    .update({
      visits_per_reward: input.visitsPerReward,
      reward_description: input.rewardDescription,
      min_hours_between_visits: input.minHoursBetweenVisits,
      birthday_message: input.birthdayMessage,
    })
    .eq("id", 1)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    logEvent("error", { message: "No se pudo guardar la configuración de la tarjeta", code: "LOYALTY_SETTINGS" });
    throw new AppError("No se pudo guardar la configuración.", "LOYALTY_SETTINGS", 500);
  }
}

async function loadBirthdayMembers(): Promise<BirthdayMemberRow[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("loyalty_members")
    .select("id, full_name, folio, phone, photo_path, birth_day, birth_month")
    .eq("status", "active")
    .eq("marketing_consent", true);

  if (error) {
    logEvent("error", { message: "No se pudo leer la lista de cumpleaños", code: "BIRTHDAY_READ" });
    throw new AppError("No se pudo leer la lista de cumpleaños.", "BIRTHDAY_READ", 500);
  }
  return (data ?? []) as BirthdayMemberRow[];
}

function collectMatches(
  members: BirthdayMemberRow[],
  dates: CalendarDate[]
): { member: BirthdayMemberRow; observed: CalendarDate }[] {
  const matches: { member: BirthdayMemberRow; observed: CalendarDate }[] = [];
  for (const member of members) {
    const observed = birthdayOnDates(member.birth_month, member.birth_day, dates);
    if (observed) {
      matches.push({ member, observed });
    }
  }
  matches.sort((left, right) => {
    if (left.observed.month !== right.observed.month) {
      return left.observed.month - right.observed.month;
    }
    if (left.observed.day !== right.observed.day) {
      return left.observed.day - right.observed.day;
    }
    return left.member.full_name.localeCompare(right.member.full_name, "es");
  });
  return matches;
}

export async function getBirthdayBoard(now = new Date()): Promise<BirthdayBoard> {
  const env = getServerEnv();
  const today = zonedDate(now, env.businessTimezone);
  const week = weekDatesMondayToSunday(today);
  const upcoming = upcomingDates(today, 7);
  const members = await loadBirthdayMembers();
  const settings = await loadSettings();
  const groups = {
    today: collectMatches(members, [today]),
    week: collectMatches(members, week),
    upcoming: collectMatches(members, upcoming),
  };
  const years = new Set<number>();
  const ids = new Set<string>();
  for (const group of Object.values(groups)) {
    for (const match of group) {
      years.add(match.observed.year);
      ids.add(match.member.id);
    }
  }

  const statusByKey = new Map<string, BirthdaySendStatus>();
  if (ids.size > 0) {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("birthday_messages")
      .select("member_id, year, status")
      .in("member_id", [...ids])
      .in("year", [...years]);
    if (error) {
      logEvent("error", { message: "No se pudo leer el estado de los cumpleaños", code: "BIRTHDAY_STATUS" });
      throw new AppError("No se pudo leer el estado de los cumpleaños.", "BIRTHDAY_STATUS", 500);
    }
    for (const row of (data ?? []) as { member_id: string; year: number; status: BirthdaySendStatus }[]) {
      if (row.status === "sent" || row.status === "failed" || row.status === "pending") {
        statusByKey.set(`${row.member_id}:${row.year}`, row.status);
      }
    }
  }

  const photos = await signPhotos(members.map((member) => member.photo_path));

  function toEntries(matches: { member: BirthdayMemberRow; observed: CalendarDate }[]): BirthdayEntry[] {
    return matches.map((match) => ({
      id: match.member.id,
      fullName: match.member.full_name,
      firstName: firstName(match.member.full_name),
      folio: match.member.folio,
      photoUrl: photos.get(match.member.photo_path) ?? null,
      whenLabel: formatSpanishDay(match.observed),
      year: match.observed.year,
      sendStatus: statusByKey.get(`${match.member.id}:${match.observed.year}`) ?? "none",
      messagePreview: composeBirthdayMessage(settings.birthday_message, match.member.full_name),
      whatsappUrl:
        env.notificationProvider === "wa_me"
          ? birthdayWaMeUrl(
              match.member.phone,
              composeBirthdayMessage(settings.birthday_message, match.member.full_name)
            )
          : null,
    }));
  }

  return {
    provider: env.notificationProvider,
    today: toEntries(groups.today),
    week: toEntries(groups.week),
    upcoming: toEntries(groups.upcoming),
  };
}

export async function countBirthdaysThisWeek(now = new Date()): Promise<number> {
  const today = zonedDate(now, timezone());
  const members = await loadBirthdayMembers();
  return collectMatches(members, weekDatesMondayToSunday(today)).length;
}

export async function markBirthdaySent(
  memberId: string,
  year: number,
  staffId: string,
  now = new Date()
): Promise<void> {
  const env = getServerEnv();
  if (env.notificationProvider !== "wa_me") {
    throw new AppError("El envío automático no se marca a mano.", "VALIDATION", 400);
  }

  const member = await loadMemberBy("id", memberId);
  if (!member || member.status !== "active" || !member.marketing_consent) {
    throw new AppError("Ese cliente no recibe felicitaciones.", "NOT_FOUND", 404);
  }

  const today = zonedDate(now, env.businessTimezone);
  const windows = [today, ...weekDatesMondayToSunday(today), ...upcomingDates(today, 7)];
  const listed = windows.some(
    (date) =>
      date.year === year &&
      birthdayOnDates(member.birth_month, member.birth_day, [date]) !== null
  );
  if (!listed) {
    throw new AppError("Ese cumpleaños no está en la lista.", "VALIDATION", 400);
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("birthday_messages").upsert(
    {
      member_id: memberId,
      year,
      idempotency_key: birthdayMessageKey(memberId, year),
      status: "sent",
      sent_at: now.toISOString(),
      marked_sent_by: staffId,
    },
    { onConflict: "idempotency_key" }
  );

  if (error) {
    logEvent("error", { message: "No se pudo marcar la felicitación", code: "BIRTHDAY_MARK" });
    throw new AppError("No se pudo marcar la felicitación.", "BIRTHDAY_MARK", 500);
  }
}
