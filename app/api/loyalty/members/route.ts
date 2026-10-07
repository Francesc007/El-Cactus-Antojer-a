import { requireStaff } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import {
  LOYALTY_HONEYPOT_FIELD,
  LOYALTY_PHOTO_MAX_BYTES,
  LOYALTY_SIGNUP_RATE_MAX,
  LOYALTY_SIGNUP_RATE_WINDOW_MINUTES,
} from "@/lib/loyalty";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { createLoyaltyMember, searchLoyaltyMembers } from "@/lib/services/loyalty";

function readText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function readInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d{1,4}$/.test(value)) {
    return null;
  }
  return Number(value);
}

export async function GET(request: Request) {
  try {
    await requireStaff();
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const members = await searchLoyaltyMembers(query);
    return jsonOk({ members });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const limit = await consumeRateLimit(
      `loyalty-signup:${clientIp(request)}`,
      LOYALTY_SIGNUP_RATE_MAX,
      LOYALTY_SIGNUP_RATE_WINDOW_MINUTES
    );
    if (!limit.allowed) {
      return Response.json(
        { error: "Demasiados intentos. Espera un momento y vuelve a intentar.", code: "RATE_LIMIT" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const form = await request.formData();
    const trap = readText(form.get(LOYALTY_HONEYPOT_FIELD)).trim();
    if (trap.length > 0) {
      throw new AppError("No se pudo crear la tarjeta.", "REJECTED", 400);
    }

    const yearRaw = readText(form.get("birthYear")).trim();
    const birthYear = yearRaw.length === 0 ? null : readInt(yearRaw);
    const birthDay = readInt(form.get("birthDay"));
    const birthMonth = readInt(form.get("birthMonth"));
    if (birthDay === null || birthMonth === null || (yearRaw.length > 0 && birthYear === null)) {
      throw new AppError("Revisa el día y el mes de nacimiento.", "VALIDATION", 400);
    }

    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size === 0 || photo.size > LOYALTY_PHOTO_MAX_BYTES) {
      throw new AppError(
        "La foto debe ser JPEG, PNG o WebP y pesar menos de 2 MB.",
        "INVALID_PHOTO",
        400
      );
    }

    const created = await createLoyaltyMember({
      fullName: readText(form.get("fullName")),
      phoneRaw: readText(form.get("phone")),
      birthDay,
      birthMonth,
      birthYear,
      photo: new Uint8Array(await photo.arrayBuffer()),
      consent: form.get("marketingConsent") === "yes",
    });

    return jsonOk(created, 201);
  } catch (error) {
    return jsonError(error);
  }
}
