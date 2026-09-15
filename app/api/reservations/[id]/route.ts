import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { updateReservationStatus } from "@/lib/services/reservations";
import { updateReservationStatusSchema } from "@/lib/validation/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireStaff();
    const { id } = await context.params;
    const body = updateReservationStatusSchema.parse(await request.json());
    const reservation = await updateReservationStatus(id, body.status, profile.id);
    return jsonOk({ reservation });
  } catch (error) {
    return jsonError(error);
  }
}
