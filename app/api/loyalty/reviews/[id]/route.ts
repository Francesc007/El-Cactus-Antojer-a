import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { resolveReview } from "@/lib/services/reviews";
import { resolveReviewSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    const { id } = await context.params;
    const body = resolveReviewSchema.parse(await request.json());
    await resolveReview(id, body.status, profile.id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
