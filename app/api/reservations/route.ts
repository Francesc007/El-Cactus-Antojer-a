import { getServerEnv } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { enqueueReservationNotification } from "@/lib/notifications";
import { createReservation, listReservationsByDate } from "@/lib/services/reservations";
import { requireStaff } from "@/lib/auth";
import { isoDateSchema, newReservationSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { searchParams } = new URL(request.url);
    const date = isoDateSchema.parse(searchParams.get("date"));
    const reservations = await listReservationsByDate(date);
    return jsonOk({ reservations });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const limit = await consumeRateLimit(
      `reservation:${clientIp(request)}`,
      env.reservationRateLimitMax,
      env.reservationRateLimitWindowMinutes
    );

    if (!limit.allowed) {
      return Response.json(
        { error: "Demasiadas reservas. Intenta más tarde.", code: "RATE_LIMIT" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    const body = newReservationSchema.parse(await request.json());
    const reservation = await createReservation(body);
    const notification = await enqueueReservationNotification(reservation);
    return jsonOk({ reservation, notification }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
