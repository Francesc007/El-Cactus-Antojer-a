import type { Product, StockMovement } from "./types";

export type StockStatus = "ok" | "warning" | "low";

export function calculateStock(
  productId: string,
  movements: StockMovement[]
): number {
  return movements
    .filter((m) => m.productId === productId)
    .reduce(
      (total, m) => total + (m.type === "in" ? m.quantity : -m.quantity),
      0
    );
}

export function isLowStock(product: Product, stock: number): boolean {
  return stock <= product.minStock;
}

/** Amarillo: exactamente 1 unidad por encima del mínimo (kg, lt, pieza, etc.). */
export function isWarningStock(product: Product, stock: number): boolean {
  return stock > product.minStock && stock <= product.minStock + 1;
}

export function getStockStatus(product: Product, stock: number): StockStatus {
  if (isLowStock(product, stock)) return "low";
  if (isWarningStock(product, stock)) return "warning";
  return "ok";
}

export function getProductStockMap(
  products: Product[],
  movements: StockMovement[]
): Map<string, number> {
  return new Map(
    products.map((p) => [p.id, calculateStock(p.id, movements)])
  );
}
