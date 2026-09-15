import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { deleteProduct, updateProduct } from "@/lib/services/inventory";
import { updateProductSchema } from "@/lib/validation/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireStaff();
    const { id } = await context.params;
    const body = updateProductSchema.parse(await request.json());
    const product = await updateProduct(id, body);
    return jsonOk({ product });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireStaff();
    const { id } = await context.params;
    await deleteProduct(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
