import { normalizeLoyaltyFolio, normalizeLoyaltyPhone } from "@/lib/loyalty";
import { BUSINESS_INFO } from "@/lib/business-info";
import type { ReviewPlatform, ReviewStatus } from "@/lib/types";

export const REVIEW_EVIDENCE_BUCKET = "review-evidence";
export const REVIEW_EVIDENCE_SIGNED_SECONDS = 15 * 60;
export const REVIEW_IMAGE_MAX_BYTES = 1 * 1024 * 1024;
export const REVIEW_IMAGE_TARGET_BYTES = 450 * 1024;
export const REVIEW_IMAGE_MAX_EDGE = 1600;
export const REVIEW_SUBMIT_RATE_MAX = 6;
export const REVIEW_SUBMIT_RATE_WINDOW_MINUTES = 15;
export const REVIEW_STATUS_RATE_MAX = 20;
export const REVIEW_STATUS_RATE_WINDOW_MINUTES = 15;
export const REVIEW_HONEYPOT_FIELD = "fax_number";
export const REVIEW_IDENTIFIER_STORAGE_KEY = "cactus-review-identifier";
export const REVIEW_LIST_LIMIT = 100;

export const REVIEW_PLATFORMS: readonly ReviewPlatform[] = ["google", "facebook", "instagram"];

export const REVIEW_PLATFORM_LABEL: Record<ReviewPlatform, string> = {
  google: "Google Maps",
  facebook: "Facebook",
  instagram: "Instagram",
};

export const REVIEW_PLATFORM_ACTION: Record<ReviewPlatform, string> = {
  google: "Deja tu reseña",
  facebook: "Deja una recomendación",
  instagram: "Etiquétanos en tu historia / Síguenos",
};

export const REVIEW_PLATFORM_URL: Record<ReviewPlatform, string> = {
  google: BUSINESS_INFO.reviews.google,
  facebook: BUSINESS_INFO.reviews.facebook,
  instagram: BUSINESS_INFO.reviews.instagram,
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const GREEN_HEART = String.fromCodePoint(0x1f49a);

export const REVIEW_THANKS_TITLE = `¡Gracias por tu apoyo! ${GREEN_HEART}`;
export const REVIEW_THANKS_BODY =
  "Recibimos tu captura y la revisaremos muy pronto. Gente como tú hace crecer a El Cactus.";

export type ReviewIdentifier = {
  kind: "phone" | "folio";
  value: string;
};

export function isReviewPlatform(value: string): value is ReviewPlatform {
  return value === "google" || value === "facebook" || value === "instagram";
}

export function isReviewStatus(value: string): value is ReviewStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export function parseReviewIdentifier(input: string): ReviewIdentifier | null {
  const folio = normalizeLoyaltyFolio(input);
  if (folio) {
    return { kind: "folio", value: folio };
  }
  const phone = normalizeLoyaltyPhone(input);
  if (phone) {
    return { kind: "phone", value: phone };
  }
  return null;
}

export function reviewInstruction(platform: ReviewPlatform): string {
  const name = REVIEW_PLATFORM_LABEL[platform];
  if (platform === "google") {
    return `Te abrimos ${name} en otra pestaña. Haz tu reseña, toma una captura de pantalla y regresa aquí para subirla.`;
  }
  if (platform === "facebook") {
    return `Te abrimos ${name} en otra pestaña. Deja tu recomendación, toma una captura de pantalla y regresa aquí para subirla.`;
  }
  return `Te abrimos ${name} en otra pestaña. Etiquétanos en tu historia o síguenos, toma una captura de pantalla y regresa aquí para subirla.`;
}

export function reviewEvidencePath(
  memberId: string,
  fileId: string,
  extension: "jpg" | "png" | "webp"
): string {
  return `${memberId}/${fileId}.${extension}`;
}

export function isReviewEvidencePath(path: string): boolean {
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path);
}

export function reviewIdentifierHint(): string {
  return "Escribe tu teléfono de 10 dígitos o tu folio (C-0001).";
}
