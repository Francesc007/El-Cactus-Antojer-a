import { jsonError, jsonOk } from "@/lib/http";
import { getAvailability } from "@/lib/services/reservations";
import { availabilityQuerySchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = availabilityQuerySchema.parse({
      date: searchParams.get("date"),
      partySize: searchParams.get("partySize") ?? "1",
    });
    const result = await getAvailability(query.date, query.partySize);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
