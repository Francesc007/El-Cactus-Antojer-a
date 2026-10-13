import { AppError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env";
import { detectLoyaltyImage, firstName, formatBusinessDateTime } from "@/lib/loyalty";
import { logEvent } from "@/lib/observability";
import {
  REVIEW_ARCHIVE_AFTER_DAYS,
  REVIEW_ARCHIVE_BATCH,
  REVIEW_EVIDENCE_BUCKET,
  REVIEW_EVIDENCE_SIGNED_SECONDS,
  REVIEW_IMAGE_MAX_BYTES,
  REVIEW_PAGE_SIZE,
  isReviewEvidencePath,
  isReviewPlatform,
  isReviewStatus,
  parseReviewIdentifier,
  reviewEvidencePath,
  reviewIdentifierHint,
  reviewPeriodStart,
} from "@/lib/reviews";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  ReviewListPage,
  ReviewPeriod,
  ReviewPlatform,
  ReviewPublicStatus,
  ReviewStatus,
} from "@/lib/types";

type DbError = {
  code?: string;
  message?: string;
};

type MemberLookupRow = {
  id: string;
  full_name: string;
  phone: string;
  folio: string;
  status: "active" | "inactive";
  google_review_submitted: boolean;
};

type ReviewRow = {
  id: string;
  member_id: string;
  platform: ReviewPlatform;
  image_path: string;
  status: ReviewStatus;
  created_at: string;
  validated_at: string | null;
  image_archived_at: string | null;
  loyalty_members:
    | {
        full_name: string;
        phone: string;
        folio: string;
      }
    | {
        full_name: string;
        phone: string;
        folio: string;
      }[]
    | null;
};

function throwReviewRpc(error: DbError): never {
  const message = error.message ?? "";
  if (message.includes("MEMBER_NOT_FOUND")) {
    throw new AppError("No encontramos esa tarjeta.", "NOT_FOUND", 404);
  }
  if (message.includes("MEMBER_INACTIVE")) {
    throw new AppError("Esta tarjeta está inactiva.", "MEMBER_INACTIVE", 409);
  }
  if (message.includes("GOOGLE_REVIEW_ALREADY_SUBMITTED")) {
    throw new AppError(
      "Ya registramos tu reseña de Google Maps.",
      "GOOGLE_REVIEW_ALREADY_SUBMITTED",
      409
    );
  }
  if (message.includes("REVIEW_ALREADY_PENDING")) {
    throw new AppError(
      "Ya tienes una captura de esa red en revisión.",
      "REVIEW_ALREADY_PENDING",
      409
    );
  }
  if (message.includes("REVIEW_NOT_FOUND")) {
    throw new AppError("No encontramos esa evidencia.", "REVIEW_NOT_FOUND", 404);
  }
  if (message.includes("REVIEW_NOT_PENDING")) {
    throw new AppError("Esa evidencia ya fue revisada.", "REVIEW_NOT_PENDING", 409);
  }
  if (error.code === "23505") {
    if ((error.message ?? "").includes("review_submissions_google_open_uidx")) {
      throw new AppError(
        "Ya registramos tu reseña de Google Maps.",
        "GOOGLE_REVIEW_ALREADY_SUBMITTED",
        409
      );
    }
    throw new AppError(
      "Ya tienes una captura de esa red en revisión.",
      "REVIEW_ALREADY_PENDING",
      409
    );
  }
  logEvent("error", { message: "No se pudo completar la reseña", code: "REVIEW_RPC" });
  throw new AppError("No se pudo completar la acción.", "REVIEW_RPC", 500);
}

async function loadMemberByIdentifier(raw: string): Promise<MemberLookupRow> {
  const identifier = parseReviewIdentifier(raw);
  if (!identifier) {
    throw new AppError(reviewIdentifierHint(), "VALIDATION", 400);
  }

  const admin = createAdminSupabaseClient();
  const column = identifier.kind === "folio" ? "folio" : "phone";
  const { data, error } = await admin
    .from("loyalty_members")
    .select("id, full_name, phone, folio, status, google_review_submitted")
    .eq(column, identifier.value)
    .maybeSingle();

  if (error) {
    logEvent("error", { message: "No se pudo leer la tarjeta para la reseña", code: "REVIEW_MEMBER_READ" });
    throw new AppError("No se pudo leer la tarjeta.", "LOYALTY_READ", 500);
  }
  if (!data) {
    throw new AppError(
      "No encontramos una tarjeta VIP con ese dato. Genera tu tarjeta para enviar la captura.",
      "NOT_FOUND",
      404
    );
  }
  return data as MemberLookupRow;
}

async function removeEvidence(path: string): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.storage.from(REVIEW_EVIDENCE_BUCKET).remove([path]);
  if (error) {
    logEvent("error", { message: "No se pudo borrar la captura de reseña", code: "REVIEW_PHOTO_DELETE" });
    return false;
  }
  return true;
}

async function signEvidence(paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((path) => path.length > 0))];
  const map = new Map<string, string>();
  if (unique.length === 0) {
    return map;
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(REVIEW_EVIDENCE_BUCKET)
    .createSignedUrls(unique, REVIEW_EVIDENCE_SIGNED_SECONDS);

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

function memberFromJoin(
  join: ReviewRow["loyalty_members"]
): { full_name: string; phone: string; folio: string } | null {
  if (!join) {
    return null;
  }
  return Array.isArray(join) ? (join[0] ?? null) : join;
}

export async function getReviewStatus(rawIdentifier: string): Promise<ReviewPublicStatus> {
  const member = await loadMemberByIdentifier(rawIdentifier);
  if (member.status !== "active") {
    throw new AppError("Esta tarjeta está inactiva.", "MEMBER_INACTIVE", 409);
  }
  return {
    firstName: firstName(member.full_name),
    googleSubmitted: member.google_review_submitted,
  };
}

export async function submitReview(input: {
  identifierRaw: string;
  platform: string;
  photo: Uint8Array;
}): Promise<{ reviewId: string }> {
  if (!isReviewPlatform(input.platform)) {
    throw new AppError("Esa red social no es válida.", "INVALID_PLATFORM", 400);
  }

  const member = await loadMemberByIdentifier(input.identifierRaw);
  if (member.status !== "active") {
    throw new AppError("Esta tarjeta está inactiva.", "MEMBER_INACTIVE", 409);
  }

  if (input.photo.byteLength === 0 || input.photo.byteLength > REVIEW_IMAGE_MAX_BYTES) {
    throw new AppError(
      "La captura debe ser JPEG, PNG o WebP y pesar menos de 1 MB.",
      "INVALID_PHOTO",
      400
    );
  }

  const kind = detectLoyaltyImage(input.photo);
  if (!kind) {
    throw new AppError(
      "La captura debe ser JPEG, PNG o WebP y pesar menos de 1 MB.",
      "INVALID_PHOTO",
      400
    );
  }

  const path = reviewEvidencePath(member.id, crypto.randomUUID(), kind.extension);
  if (!isReviewEvidencePath(path)) {
    throw new AppError("No se pudo guardar la captura.", "PHOTO_UPLOAD", 500);
  }

  const admin = createAdminSupabaseClient();
  try {
    const { error: uploadError } = await admin.storage.from(REVIEW_EVIDENCE_BUCKET).upload(path, input.photo, {
      contentType: kind.mime,
      upsert: false,
    });
    if (uploadError) {
      logEvent("error", { message: "No se pudo guardar la captura de reseña", code: "REVIEW_PHOTO_UPLOAD" });
      throw new AppError("No se pudo guardar la captura.", "PHOTO_UPLOAD", 500);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logEvent("error", { message: "No se pudo guardar la captura de reseña", code: "REVIEW_PHOTO_UPLOAD" });
    throw new AppError("No se pudo guardar la captura.", "PHOTO_UPLOAD", 500);
  }

  const { data, error } = await admin.rpc("submit_review", {
    p_member_id: member.id,
    p_platform: input.platform,
    p_image_path: path,
  });

  if (error || !data) {
    await removeEvidence(path);
    throwReviewRpc(error ?? { message: "REVIEW_RPC" });
  }

  const reviewId = String((data as { reviewId?: string }).reviewId ?? "");
  if (!reviewId) {
    await removeEvidence(path);
    throw new AppError("No se pudo guardar la evidencia.", "REVIEW_RPC", 500);
  }
  return { reviewId };
}

export async function archiveExpiredReviewEvidence(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - REVIEW_ARCHIVE_AFTER_DAYS * 86_400_000).toISOString();
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("review_submissions")
    .select("id, image_path")
    .eq("status", "approved")
    .is("image_archived_at", null)
    .lt("validated_at", cutoff)
    .limit(REVIEW_ARCHIVE_BATCH);

  if (error || !data) {
    logEvent("error", { message: "No se pudieron archivar las capturas", code: "REVIEW_ARCHIVE" });
    return 0;
  }

  let archived = 0;
  for (const row of data as { id: string; image_path: string }[]) {
    if (!isReviewEvidencePath(row.image_path)) {
      continue;
    }
    const removed = await removeEvidence(row.image_path);
    if (!removed) {
      continue;
    }
    const { error: updateError } = await admin
      .from("review_submissions")
      .update({ image_archived_at: now.toISOString() })
      .eq("id", row.id)
      .is("image_archived_at", null);
    if (!updateError) {
      archived += 1;
    }
  }
  return archived;
}

export async function listReviews(input: {
  status: ReviewStatus;
  period: ReviewPeriod;
  page: number;
}): Promise<ReviewListPage> {
  if (!isReviewStatus(input.status)) {
    throw new AppError("Ese estado no es válido.", "INVALID_STATUS", 400);
  }

  try {
    await archiveExpiredReviewEvidence();
  } catch {
    logEvent("error", { message: "No se pudieron archivar las capturas", code: "REVIEW_ARCHIVE" });
  }

  const zone = getServerEnv().businessTimezone;
  const admin = createAdminSupabaseClient();
  const from = (input.page - 1) * REVIEW_PAGE_SIZE;
  const to = from + REVIEW_PAGE_SIZE - 1;
  let request = admin
    .from("review_submissions")
    .select(
      "id, member_id, platform, image_path, status, created_at, validated_at, image_archived_at, loyalty_members!inner(full_name, phone, folio)",
      { count: "exact" }
    )
    .eq("status", input.status);

  if (input.status === "pending") {
    request = request.order("created_at", { ascending: false });
  } else {
    const start = reviewPeriodStart(input.period, new Date(), zone);
    if (start) {
      request = request.gte("validated_at", start);
    }
    request = request.order("validated_at", { ascending: false });
  }

  const { data, error, count } = await request.range(from, to);
  if (error) {
    logEvent("error", { message: "No se pudieron leer las reseñas", code: "REVIEW_LIST" });
    throw new AppError("No se pudieron leer las reseñas.", "REVIEW_LIST", 500);
  }

  const rows = (data ?? []) as ReviewRow[];
  const photos = await signEvidence(
    rows.filter((row) => !row.image_archived_at).map((row) => row.image_path)
  );

  return {
    page: input.page,
    pageSize: REVIEW_PAGE_SIZE,
    total: count ?? rows.length,
    reviews: rows.flatMap((row) => {
      const member = memberFromJoin(row.loyalty_members);
      if (!member) {
        return [];
      }
      const archived = row.image_archived_at !== null;
      return [
        {
          id: row.id,
          memberId: row.member_id,
          fullName: member.full_name,
          folio: member.folio,
          phone: member.phone,
          platform: row.platform,
          imageUrl: archived ? null : (photos.get(row.image_path) ?? null),
          archived,
          status: row.status,
          createdAt: row.created_at,
          createdAtLabel: formatBusinessDateTime(row.created_at, zone),
          validatedAtLabel: row.validated_at ? formatBusinessDateTime(row.validated_at, zone) : null,
        },
      ];
    }),
  };
}

export async function resolveReview(
  reviewId: string,
  status: "approved" | "rejected",
  staffId: string
): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc("resolve_review", {
    p_review_id: reviewId,
    p_status: status,
    p_staff_id: staffId,
  });
  if (error) {
    throwReviewRpc(error);
  }
  // Punto de extensión: aquí se otorgaría un sello o premio al aprobar.
}

export async function removeReviewEvidenceForMember(memberId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage.from(REVIEW_EVIDENCE_BUCKET).list(memberId);
  if (error) {
    logEvent("error", {
      message: "No se pudieron listar las capturas de reseña",
      code: "REVIEW_PHOTO_LIST",
    });
    return;
  }
  const paths = (data ?? [])
    .map((file) => file.name)
    .filter((name): name is string => Boolean(name))
    .map((name) => `${memberId}/${name}`);
  if (paths.length === 0) {
    return;
  }
  const { error: removeError } = await admin.storage.from(REVIEW_EVIDENCE_BUCKET).remove(paths);
  if (removeError) {
    logEvent("error", {
      message: "No se pudieron borrar las capturas de reseña",
      code: "REVIEW_PHOTO_DELETE",
    });
  }
}
