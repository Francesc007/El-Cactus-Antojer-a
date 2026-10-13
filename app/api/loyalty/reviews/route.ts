import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { listReviews } from "@/lib/services/reviews";
import { reviewStatusSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const raw = new URL(request.url).searchParams.get("status") ?? "pending";
    const status = reviewStatusSchema.parse(raw);
    const reviews = await listReviews(status);
    return jsonOk({ reviews });
  } catch (error) {
    return jsonError(error);
  }
}
