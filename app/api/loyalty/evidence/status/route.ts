import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import {
  REVIEW_STATUS_RATE_MAX,
  REVIEW_STATUS_RATE_WINDOW_MINUTES,
  reviewIdentifierHint,
} from "@/lib/reviews";
import { getReviewStatus } from "@/lib/services/reviews";

export async function GET(request: Request) {
  try {
    const limit = await consumeRateLimit(
      `review-status:${clientIp(request)}`,
      REVIEW_STATUS_RATE_MAX,
      REVIEW_STATUS_RATE_WINDOW_MINUTES
    );
    if (!limit.allowed) {
      return Response.json(
        { error: "Demasiados intentos. Espera un momento y vuelve a intentar.", code: "RATE_LIMIT" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const query = new URL(request.url).searchParams.get("q") ?? "";
    if (query.trim().length === 0) {
      throw new AppError(reviewIdentifierHint(), "VALIDATION", 400);
    }

    const status = await getReviewStatus(query);
    return jsonOk(status);
  } catch (error) {
    return jsonError(error);
  }
}
