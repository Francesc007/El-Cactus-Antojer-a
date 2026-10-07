import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { registerLoyaltyVisit } from "@/lib/services/loyalty";
import { loyaltyVisitSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    const { id } = await context.params;
    const body = loyaltyVisitSchema.parse(await request.json());
    await registerLoyaltyVisit(id, profile.id, body.source, body.force);
    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
