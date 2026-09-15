import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import {
  createBlockedSlot,
  deleteBlockedSlot,
  listBlockedSlots,
} from "@/lib/services/reservations";
import { newBlockedSlotSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const date = new URL(request.url).searchParams.get("date");
    if (!date) {
      return jsonError(new Error("Falta la fecha"));
    }
    const slots = await listBlockedSlots(date);
    return jsonOk({ slots });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireStaff();
    const body = newBlockedSlotSchema.parse(await request.json());
    const slot = await createBlockedSlot(body, profile.id);
    return jsonOk({ slot }, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireStaff();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return jsonError(new Error("Falta el id"));
    }
    await deleteBlockedSlot(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
