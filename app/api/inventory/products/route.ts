import { requireStaff } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createProduct, listProducts } from "@/lib/services/inventory";
import { newProductSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await requireStaff();
    const products = await listProducts();
    return jsonOk({ products });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff();
    const body = newProductSchema.parse(await request.json());
    const product = await createProduct(body);
    return jsonOk({ product }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
