import { requireStaff } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { getLoyaltyPreviewByCode, getLoyaltyPreviewByPhone } from "@/lib/services/loyalty";

export async function GET(request: Request) {
  try {
    const { profile } = await requireStaff();
    const params = new URL(request.url).searchParams;
    const code = params.get("code");
    const phone = params.get("phone");
    if (code) {
      const preview = await getLoyaltyPreviewByCode(code);
      return jsonOk({ preview, viewerRole: profile.role });
    }
    if (phone) {
      const preview = await getLoyaltyPreviewByPhone(phone);
      return jsonOk({ preview, viewerRole: profile.role });
    }
    throw new AppError("Indica el código de la tarjeta o el teléfono.", "VALIDATION", 400);
  } catch (error) {
    return jsonError(error);
  }
}
