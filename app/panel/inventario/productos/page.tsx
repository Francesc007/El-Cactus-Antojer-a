"use client";

import { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { StockStatusBadge } from "@/components/panel/inventory/StockStatusBadge";
import type { Product } from "@/lib/types";

const UNITS = ["kg", "lt", "pieza", "paquete", "caja"];

export default function InventarioProductosPage() {
  const { products, getStock, isProductLowStock, addProduct, updateProduct } =
    useInventory();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [minStock, setMinStock] = useState(1);

  function resetForm() {
    setName("");
    setUnit("kg");
    setMinStock(1);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setUnit(product.unit);
    setMinStock(product.minStock);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      updateProduct(editingId, {
        name: name.trim(),
        unit,
        minStock,
      });
    } else {
      addProduct({ name: name.trim(), unit, minStock });
    }
    resetForm();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-cactus-charcoal">
            Catálogo de productos
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Administra insumos y niveles mínimos de stock.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-secondary px-5 py-2.5 text-sm"
        >
          + Nuevo producto
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="premium-card mt-6 space-y-4 p-5"
        >
          <h3 className="font-display font-bold text-cactus-forest">
            {editingId ? "Editar producto" : "Alta de producto"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="prod-name" className="text-sm font-semibold">
                Nombre
              </label>
              <input
                id="prod-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-premium mt-1"
                placeholder="Ej. Pechuga de pollo"
              />
            </div>
            <div>
              <label htmlFor="prod-unit" className="text-sm font-semibold">
                Unidad
              </label>
              <select
                id="prod-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-premium mt-1"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prod-min" className="text-sm font-semibold">
                Stock mínimo
              </label>
              <input
                id="prod-min"
                type="number"
                min={0}
                step="0.1"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                required
                className="input-premium mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-secondary px-5 py-2 text-sm">
              {editingId ? "Guardar cambios" : "Agregar producto"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="premium-card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cactus-sand/60 bg-stone-50/80">
            <tr>
              <th className="px-5 py-3 font-semibold text-stone-600">Nombre</th>
              <th className="px-5 py-3 font-semibold text-stone-600">Unidad</th>
              <th className="px-5 py-3 font-semibold text-stone-600">Stock</th>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Mínimo
              </th>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Estado
              </th>
              <th className="px-5 py-3 font-semibold text-stone-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
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
                  <td className="px-5 py-3 text-stone-500">{product.unit}</td>
                  <td className="px-5 py-3 font-mono font-semibold">
                    {stock}
                  </td>
                  <td className="px-5 py-3 text-stone-500">
                    {product.minStock}
                  </td>
                  <td className="px-5 py-3">
                    <StockStatusBadge isLow={low} />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="text-xs font-semibold text-cactus-forest hover:text-cactus-sunset"
                    >
                      Editar
                    </button>
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
