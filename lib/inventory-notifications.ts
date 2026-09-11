import type { Product } from "./types";

export type LowStockNotificationResult = {
  message: string;
  productName: string;
};

export function notifyLowStock(
  product: Product,
  currentStock: number
): LowStockNotificationResult {
  // TODO: conectar a la misma notificación de WhatsApp/email que se usa en reservas
  return {
    message: `Alerta de stock bajo (simulada): ${product.name} tiene ${currentStock} ${product.unit} (mínimo: ${product.minStock})`,
    productName: product.name,
  };
}
