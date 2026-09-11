import type { Product, StockMovement } from "./types";

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

export function getProductStockMap(
  products: Product[],
  movements: StockMovement[]
): Map<string, number> {
  return new Map(
    products.map((p) => [p.id, calculateStock(p.id, movements)])
  );
}
