"use client";

import Link from "next/link";
import { useInventory } from "@/context/InventoryContext";
import { StockStatusBadge } from "@/components/panel/inventory/StockStatusBadge";

export default function InventarioDashboardPage() {
  const { products, getStock, isProductLowStock, lowStockProducts } =
    useInventory();

  const sortedProducts = [...products].sort((a, b) => {
    const aLow = isProductLowStock(a.id);
    const bLow = isProductLowStock(b.id);
    if (aLow !== bLow) return aLow ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="premium-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Productos
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-cactus-forest">
            {products.length}
          </p>
        </div>
        <div className="premium-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Stock bajo
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-red-600">
            {lowStockProducts.length}
          </p>
        </div>
        <div className="premium-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Acciones rápidas
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link
              href="/panel/inventario/movimientos"
              className="font-semibold text-cactus-forest hover:text-cactus-sunset"
            >
              + Registrar movimiento
            </Link>
            <Link
              href="/panel/inventario/productos"
              className="font-semibold text-cactus-forest hover:text-cactus-sunset"
            >
              + Nuevo producto
            </Link>
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="premium-card mt-6 border-red-200 bg-red-50/50 p-4">
          <p className="text-sm font-bold text-red-700">
            {lowStockProducts.length}{" "}
            {lowStockProducts.length === 1
              ? "producto requiere"
              : "productos requieren"}{" "}
            atención
          </p>
          <p className="mt-1 text-sm text-red-600/80">
            {lowStockProducts.map((p) => p.name).join(", ")}
          </p>
        </div>
      )}

      <div className="premium-card mt-6 overflow-hidden">
        <div className="border-b border-cactus-sand/60 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-cactus-charcoal">
            Stock actual
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cactus-sand/60 bg-stone-50/80">
            <tr>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Producto
              </th>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Stock actual
              </th>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Mínimo
              </th>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => {
              const stock = getStock(product.id);
              const low = isProductLowStock(product.id);
              return (
                <tr
                  key={product.id}
                  className={`border-b border-stone-100 last:border-0 ${
                    low ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-medium">{product.name}</td>
                  <td className="px-5 py-3 font-mono font-semibold">
                    {stock} {product.unit}
                  </td>
                  <td className="px-5 py-3 text-stone-500">
                    {product.minStock} {product.unit}
                  </td>
                  <td className="px-5 py-3">
                    <StockStatusBadge isLow={low} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
