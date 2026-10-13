import { mondayOfWeek, normalizeLoyaltyFolio, normalizeLoyaltyPhone, zonedDate } from "@/lib/loyalty";
import { BUSINESS_INFO } from "@/lib/business-info";
import type { ReviewPeriod, ReviewPlatform, ReviewStatus } from "@/lib/types";

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
export const REVIEW_PAGE_SIZE = 9;
export const REVIEW_ARCHIVE_AFTER_DAYS = 30;
export const REVIEW_ARCHIVE_BATCH = 40;

export const REVIEW_PLATFORMS: readonly ReviewPlatform[] = ["google", "facebook", "instagram"];

export function isReviewPeriod(value: string): value is ReviewPeriod {
  return value === "week" || value === "month" || value === "all";
}

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

export const REVIEW_THANKS_TITLE = `¡Gracias! ${GREEN_HEART}`;
export const REVIEW_THANKS_BODY =
  "Recibimos tu imagen, personas como tú hacen crecer a El Cactus.";

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

/** Inicio del periodo en la zona del negocio. Histórico no tiene límite. */
export function reviewPeriodStart(period: ReviewPeriod, now: Date, timeZone: string): string | null {
  if (period === "all") {
    return null;
  }
  const today = zonedDate(now, timeZone);
  const start =
    period === "week" ? mondayOfWeek(today) : { year: today.year, month: today.month, day: 1 };
  return zonedMidnightIso(start, timeZone);
}

function zonedClock(instant: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(instant);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  let hour = read("hour");
  if (hour === 24) {
    hour = 0;
  }
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
    second: read("second"),
  };
}

function zonedMidnightIso(
  date: { year: number; month: number; day: number },
  timeZone: string
): string {
  let guess = Date.UTC(date.year, date.month - 1, date.day, 6, 0, 0);
  const want = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0);
  for (let step = 0; step < 4; step += 1) {
    const clock = zonedClock(new Date(guess), timeZone);
    const got = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second);
    const delta = want - got;
    if (delta === 0) {
      break;
    }
    guess += delta;
  }
  return new Date(guess).toISOString();
}
