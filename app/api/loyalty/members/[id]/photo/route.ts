import { assertOwner, requireStaff } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { LOYALTY_PHOTO_MAX_BYTES } from "@/lib/loyalty";
import { replaceLoyaltyPhoto } from "@/lib/services/loyalty";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    assertOwner(profile);
    const { id } = await context.params;
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size === 0 || photo.size > LOYALTY_PHOTO_MAX_BYTES) {
      throw new AppError(
        "La foto debe ser JPEG, PNG o WebP y pesar menos de 2 MB.",
        "INVALID_PHOTO",
        400
      );
    }
    await replaceLoyaltyPhoto(id, new Uint8Array(await photo.arrayBuffer()));
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
