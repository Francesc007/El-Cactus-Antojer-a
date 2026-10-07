import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { markBirthdaySent } from "@/lib/services/loyalty";
import { markBirthdaySentSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const { profile } = await requireStaff();
    const body = markBirthdaySentSchema.parse(await request.json());
    await markBirthdaySent(body.memberId, body.year, profile.id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
