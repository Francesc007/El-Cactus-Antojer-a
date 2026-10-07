import { assertOwner, requireStaff } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { getLoyaltySettings, updateLoyaltySettings } from "@/lib/services/loyalty";
import { loyaltySettingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const { profile } = await requireStaff();
    const settings = await getLoyaltySettings();
    const canEdit = profile.role === "owner";
    return jsonOk({ settings, provider: getServerEnv().notificationProvider, canEdit });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { profile } = await requireStaff();
    assertOwner(profile);
    const body = loyaltySettingsSchema.parse(await request.json());
    await updateLoyaltySettings(body);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
