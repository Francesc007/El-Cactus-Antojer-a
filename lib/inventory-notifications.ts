import { enqueueLowStockNotification } from "@/lib/notifications";
import type { Product } from "@/lib/types";

export type LowStockNotificationResult = {
  message: string;
  productName: string;
};

export async function notifyLowStock(
  product: Product,
  currentStock: number
): Promise<LowStockNotificationResult> {
  const result = await enqueueLowStockNotification(product, currentStock);
  return {
    message: result.message,
    productName: product.name,
  };
}
