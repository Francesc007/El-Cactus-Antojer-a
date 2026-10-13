import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import {
  REVIEW_HONEYPOT_FIELD,
  REVIEW_IMAGE_MAX_BYTES,
  REVIEW_SUBMIT_RATE_MAX,
  REVIEW_SUBMIT_RATE_WINDOW_MINUTES,
  parseReviewIdentifier,
  reviewIdentifierHint,
} from "@/lib/reviews";
import { submitReview } from "@/lib/services/reviews";

export const maxDuration = 60;

function readText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const ipLimit = await consumeRateLimit(
      `review-submit:${clientIp(request)}`,
      REVIEW_SUBMIT_RATE_MAX,
      REVIEW_SUBMIT_RATE_WINDOW_MINUTES
    );
    if (!ipLimit.allowed) {
      return Response.json(
        { error: "Demasiados intentos. Espera un momento y vuelve a intentar.", code: "RATE_LIMIT" },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const form = await request.formData();
    const trap = readText(form.get(REVIEW_HONEYPOT_FIELD)).trim();
    if (trap.length > 0) {
      throw new AppError("No se pudo enviar la evidencia.", "REJECTED", 400);
    }

    const identifierRaw = readText(form.get("identifier"));
    const parsed = parseReviewIdentifier(identifierRaw);
    if (!parsed) {
      throw new AppError(reviewIdentifierHint(), "VALIDATION", 400);
    }

    const clientLimit = await consumeRateLimit(
      `review-submit-client:${parsed.kind}:${parsed.value}`,
      REVIEW_SUBMIT_RATE_MAX,
      REVIEW_SUBMIT_RATE_WINDOW_MINUTES
    );
    if (!clientLimit.allowed) {
      return Response.json(
        { error: "Demasiados intentos. Espera un momento y vuelve a intentar.", code: "RATE_LIMIT" },
        { status: 429, headers: { "Retry-After": String(clientLimit.retryAfterSeconds) } }
      );
    }

    const photo = form.get("photo");
    if (!(photo instanceof Blob) || photo.size === 0 || photo.size > REVIEW_IMAGE_MAX_BYTES) {
      throw new AppError(
        "La captura debe ser JPEG, PNG o WebP y pesar menos de 1 MB.",
        "INVALID_PHOTO",
        400
      );
    }

    const created = await submitReview({
      identifierRaw,
      platform: readText(form.get("platform")),
      photo: new Uint8Array(await photo.arrayBuffer()),
    });

    return jsonOk(created, 201);
  } catch (error) {
    return jsonError(error);
  }
}
