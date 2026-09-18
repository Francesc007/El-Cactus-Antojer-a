"use client";

import Link from "next/link";
import { useInventory } from "@/context/InventoryContext";
import { PanelSectionCard } from "@/components/panel/PanelSectionCard";
import { PanelStatCard } from "@/components/panel/PanelStatCard";
import { StockStatusBadge } from "@/components/panel/inventory/StockStatusBadge";
import { compareStockStatus, getStockRowClass } from "@/lib/inventory-ui";

export default function InventarioDashboardPage() {
  const {
    products,
    getStock,
    getProductStockStatus,
    lowStockProducts,
    warningStockProducts,
    loading,
    error,
  } = useInventory();

  const sortedProducts = [...products].sort((a, b) => {
    const statusCompare = compareStockStatus(
      getProductStockStatus(a.id),
      getProductStockStatus(b.id)
    );
    if (statusCompare !== 0) return statusCompare;
    return a.name.localeCompare(b.name);
  });

  if (loading) return <p className="text-stone-500">Cargando inventario…</p>;
  if (error) return <p className="text-red-700">{error}</p>;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        <PanelStatCard
          label="Productos"
          icon="📦"
          tone="forest"
          value={<span className="text-cactus-forest">{products.length}</span>}
        />
        <PanelStatCard
          label="Stock bajo"
          icon="🔻"
          tone="danger"
          value={<span className="text-red-600">{lowStockProducts.length}</span>}
        />
        <PanelStatCard
          label="En atención"
          icon="⚠️"
          tone="warning"
          value={<span className="text-amber-600">{warningStockProducts.length}</span>}
        />
        <PanelStatCard label="Acciones rápidas" icon="⚡" tone="lime">
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
        </PanelStatCard>
      </div>

      {(warningStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2">
          {warningStockProducts.length > 0 && (
            <div className="premium-card h-full border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm font-bold text-amber-800">
                {warningStockProducts.length}{" "}
                {warningStockProducts.length === 1
                  ? "producto se acerca"
                  : "productos se acercan"}{" "}
                al límite
              </p>
              <p className="mt-1 text-sm text-amber-700/80">
                {warningStockProducts.map((p) => p.name).join(", ")}
              </p>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="premium-card h-full border-red-200 bg-red-50/50 p-4">
              <p className="text-sm font-bold text-red-700">
                {lowStockProducts.length}{" "}
                {lowStockProducts.length === 1
                  ? "producto está"
                  : "productos están"}{" "}
                por debajo del mínimo
              </p>
              <p className="mt-1 text-sm text-red-600/80">
                {lowStockProducts.map((p) => p.name).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      <PanelSectionCard tone="forest" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cactus-sand/60 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-cactus-charcoal">
            Stock actual
          </h2>
          <a
            href="/api/inventory/stock-report"
            className="rounded-xl bg-cactus-forest px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cactus-forest-dark sm:text-sm"
          >
            Descargar PDF
          </a>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
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
              const status = getProductStockStatus(product.id);
              return (
                <tr
                  key={product.id}
                  className={`border-b border-stone-100 last:border-0 ${getStockRowClass(status)}`}
                >
                  <td className="px-5 py-3 font-medium">{product.name}</td>
                  <td className="px-5 py-3 font-mono font-semibold">
                    {stock} {product.unit}
                  </td>
                  <td className="px-5 py-3 text-stone-500">
                    {product.minStock} {product.unit}
                  </td>
                  <td className="px-5 py-3">
                    <StockStatusBadge status={status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </PanelSectionCard>
    </div>
  );
}
