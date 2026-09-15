import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getBusinessConfig, updateBusinessSettings } from "@/lib/services/reservations";
import { updateSettingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await requireStaff();
    const config = await getBusinessConfig();
    return jsonOk(config);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaff();
    const body = updateSettingsSchema.parse(await request.json());
    const capacity = await updateBusinessSettings(body);
    return jsonOk({ capacity });
  } catch (error) {
    return jsonError(error);
  }
}
