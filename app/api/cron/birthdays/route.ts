import { createHash, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { runBirthdayCron } from "@/lib/loyalty-cron";
import { logEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = getServerEnv().cronSecret;
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) {
    return false;
  }
  const provided = createHash("sha256").update(header.slice(prefix.length)).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  try {
    if (!authorized(request)) {
      logEvent("warn", { message: "Cron de cumpleaños rechazado", code: "CRON_UNAUTHORIZED" });
      return jsonOk({ error: "No autorizado." }, 401);
    }
    const result = await runBirthdayCron();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
