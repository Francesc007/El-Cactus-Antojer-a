import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { listReviews } from "@/lib/services/reviews";
import { reviewListQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const params = new URL(request.url).searchParams;
    const query = reviewListQuerySchema.parse({
      status: params.get("status") ?? undefined,
      range: params.get("range") ?? undefined,
      page: params.get("page") ?? undefined,
    });
    const result = await listReviews({
      status: query.status,
      period: query.range,
      page: query.page,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
