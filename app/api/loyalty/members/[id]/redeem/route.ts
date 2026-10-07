import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { redeemLoyaltyReward } from "@/lib/services/loyalty";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    const { id } = await context.params;
    await redeemLoyaltyReward(id, profile.id);
    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
