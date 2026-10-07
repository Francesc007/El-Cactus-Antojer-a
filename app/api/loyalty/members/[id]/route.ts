import { assertOwner, requireStaff } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import {
  deleteLoyaltyMember,
  getLoyaltyMemberDetail,
  updateLoyaltyMember,
  withdrawMarketingConsent,
} from "@/lib/services/loyalty";
import { updateLoyaltyMemberSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    const { id } = await context.params;
    const member = await getLoyaltyMemberDetail(id);
    return jsonOk({ member, viewerRole: profile.role });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    const { id } = await context.params;
    const body = updateLoyaltyMemberSchema.parse(await request.json());

    if (profile.role !== "owner") {
      const keys = Object.keys(body);
      if (body.marketingConsent !== false || keys.some((key) => key !== "marketingConsent")) {
        throw new AppError("Solo el dueño puede hacer esto.", "FORBIDDEN", 403);
      }
      await withdrawMarketingConsent(id);
      return jsonOk({ ok: true });
    }

    await updateLoyaltyMember(id, body);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    assertOwner(profile);
    const { id } = await context.params;
    await deleteLoyaltyMember(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
