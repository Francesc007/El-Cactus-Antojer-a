import { AppError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(
  key: string,
  max: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_minutes: windowMinutes,
  });

  if (error || !data || typeof data !== "object") {
    throw new AppError(
      "No se pudo validar el límite de solicitudes.",
      "RATE_LIMIT",
      500
    );
  }

  const result = data as {
    allowed?: boolean;
    remaining?: number;
    retryAfterSeconds?: number;
  };

  return {
    allowed: Boolean(result.allowed),
    remaining: Number(result.remaining ?? 0),
    retryAfterSeconds: Number(result.retryAfterSeconds ?? 1),
  };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
