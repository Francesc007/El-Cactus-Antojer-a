import { assertOwner, requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { voidLoyaltyVisit } from "@/lib/services/loyalty";
import { voidLoyaltyVisitSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string; visitId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    assertOwner(profile);
    const { visitId } = await context.params;
    const body = voidLoyaltyVisitSchema.parse(await request.json());
    await voidLoyaltyVisit(visitId, profile.id, body.reason);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
