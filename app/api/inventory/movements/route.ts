import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { notifyLowStock } from "@/lib/inventory-notifications";
import { createMovement, listMovements, listProducts } from "@/lib/services/inventory";
import { movementFiltersSchema, newMovementSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { searchParams } = new URL(request.url);
    const filters = movementFiltersSchema.parse({
      productId: searchParams.get("productId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") ?? "1",
      pageSize: searchParams.get("pageSize") ?? "10",
    });
    const result = await listMovements(filters);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireStaff();
    const body = newMovementSchema.parse(await request.json());
    const result = await createMovement(body, profile.id);
    let lowStockMessage: string | null = null;
    if (result.triggeredLowStock) {
      const products = await listProducts();
      const product = products.find((item) => item.id === body.productId);
      if (product) {
        const notice = await notifyLowStock(product, result.stockAfter);
        lowStockMessage = notice.message;
      }
    }
    return jsonOk({ ...result, lowStockMessage }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
