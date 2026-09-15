import { getStockStatus } from "@/lib/inventory";
import { AppError } from "@/lib/errors";
import { mapMovement, mapProduct } from "@/lib/mappers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  MovementFilters,
  NewMovementInput,
  NewProductInput,
  ProductWithStock,
  StockMovement,
  UpdateProductInput,
} from "@/lib/types";

export async function listProducts(): Promise<ProductWithStock[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("product_stock")
    .select("id, name, unit, min_stock, stock, created_at, updated_at")
    .order("name");

  if (error) {
    throw new AppError("No se pudieron leer los productos.", "PRODUCTS_READ", 500);
  }

  return (data ?? []).map(mapProduct);
}

export async function createProduct(input: NewProductInput): Promise<ProductWithStock> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      unit: input.unit,
      min_stock: input.minStock,
    })
    .select("id, name, unit, min_stock")
    .single();

  if (error || !data) {
    throw new AppError("No se pudo crear el producto.", "PRODUCT_CREATE", 500);
  }

  return mapProduct({ ...data, stock: 0 });
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ProductWithStock> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.minStock !== undefined ? { min_stock: input.minStock } : {}),
    })
    .eq("id", id)
    .select("id, name, unit, min_stock")
    .single();

  if (error || !data) {
    throw new AppError("No se pudo actualizar el producto.", "PRODUCT_UPDATE", 500);
  }

  const products = await listProducts();
  const withStock = products.find((p) => p.id === id);
  return withStock ?? mapProduct({ ...data, stock: 0 });
}

export async function deleteProduct(id: string): Promise<void> {
  const admin = createAdminSupabaseClient();

  const { count, error: countError } = await admin
    .from("stock_movements")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (countError) {
    throw new AppError("No se pudo validar el producto.", "PRODUCT_DELETE", 500);
  }

  if ((count ?? 0) > 0) {
    throw new AppError(
      "No se puede eliminar un producto con movimientos de inventario registrados.",
      "PRODUCT_HAS_MOVEMENTS",
      409
    );
  }

  const { data, error } = await admin.from("products").delete().eq("id", id).select("id");

  if (error) {
    throw new AppError("No se pudo eliminar el producto.", "PRODUCT_DELETE", 500);
  }

  if (!data || data.length === 0) {
    throw new AppError("El producto no existe.", "PRODUCT_NOT_FOUND", 404);
  }
}

export async function listMovements(filters: MovementFilters): Promise<{
  movements: StockMovement[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminSupabaseClient();
  let query = admin
    .from("stock_movements")
    .select(
      "id, product_id, type, quantity, date, note, created_at, created_by",
      { count: "exact" }
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);

  const { data, error, count } = await query.range(from, to);
  if (error) {
    throw new AppError("No se pudieron leer los movimientos.", "MOVEMENTS_READ", 500);
  }

  return {
    movements: (data ?? []).map(mapMovement),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function createMovement(input: NewMovementInput): Promise<{
  movement: StockMovement;
  stockAfter: number;
  triggeredLowStock: boolean;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("add_stock_movement_safe", {
    p_product_id: input.productId,
    p_type: input.type,
    p_quantity: input.quantity,
    p_date: input.date,
    p_note: input.note ?? null,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new AppError("No se pudo registrar el movimiento.", "MOVEMENT_CREATE", 500);
  }

  const products = await listProducts();
  const product = products.find((p) => p.id === input.productId);
  if (!product) {
    throw new AppError("El producto no existe.", "PRODUCT_NOT_FOUND", 404);
  }

  return {
    movement: mapMovement(row),
    stockAfter: product.stock,
    triggeredLowStock: getStockStatus(product, product.stock) === "low",
  };
}
