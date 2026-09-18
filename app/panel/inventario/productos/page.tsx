"use client";

import { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { ConfirmDialog } from "@/components/panel/ConfirmDialog";
import { PanelSectionCard } from "@/components/panel/PanelSectionCard";
import { StockStatusBadge } from "@/components/panel/inventory/StockStatusBadge";
import { getStockRowClass } from "@/lib/inventory-ui";
import type { Product } from "@/lib/types";

const UNITS = ["kg", "lt", "pieza", "paquete", "caja"];

export default function InventarioProductosPage() {
  const {
    products,
    getStock,
    getProductStockStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
  } = useInventory();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [minStock, setMinStock] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function resetForm() {
    setName("");
    setUnit("kg");
    setMinStock(1);
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
    setDeleteConfirmOpen(false);
    setDeleteError(null);
    setDeleting(false);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setUnit(product.unit);
    setMinStock(product.minStock);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setFormError(null);

    try {
      if (editingId) {
        await updateProduct(editingId, {
          name: name.trim(),
          unit,
          minStock,
        });
      } else {
        await addProduct({ name: name.trim(), unit, minStock });
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    }
  }

  function openDeleteConfirm() {
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!editingId) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(editingId);
      resetForm();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "No se pudo eliminar el producto"
      );
    } finally {
      setDeleting(false);
    }
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
          className="btn-secondary w-full px-5 py-2.5 text-sm sm:w-auto"
        >
          + Nuevo producto
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-4 text-sm text-stone-500">Cargando catálogo…</p>}

      {showForm && (
        <form
            onSubmit={(e) => void handleSubmit(e)}
          className="premium-card mt-6 space-y-4 p-5"
        >
          <h3 className="font-display font-bold text-cactus-forest">
            {editingId ? "Editar producto" : "Alta de producto"}
          </h3>
          {formError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <div className="flex flex-col">
              <label htmlFor="prod-name" className="min-h-10 text-sm font-semibold leading-snug">
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
            <div className="flex flex-col">
              <label htmlFor="prod-unit" className="min-h-10 text-sm font-semibold leading-snug">
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
            <div className="flex flex-col">
              <label htmlFor="prod-min" className="min-h-10 text-sm font-semibold leading-snug">
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
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn-secondary px-5 py-2 text-sm">
              {editingId ? "Guardar cambios" : "Agregar producto"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border-2 border-cactus-forest/35 bg-white px-5 py-2 text-sm font-semibold text-cactus-forest transition hover:bg-cactus-forest/5"
            >
              Cancelar
            </button>
            {editingId && (
              <button
                type="button"
                onClick={openDeleteConfirm}
                disabled={deleting}
                className="rounded-xl border-2 border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        tone="danger"
        title="¿Eliminar producto?"
        description={
          <>
            Vas a eliminar <strong className="text-cactus-charcoal">{name.trim()}</strong>.
            Esta acción no se puede deshacer y el producto desaparecerá del catálogo.
          </>
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="No, conservar"
        loading={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (deleting) return;
          setDeleteConfirmOpen(false);
          setDeleteError(null);
        }}
      />

      <PanelSectionCard tone="lime" className="mt-6">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
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
              const status = getProductStockStatus(product.id);
              return (
                <tr
                  key={product.id}
                  className={`border-b border-stone-100 last:border-0 ${getStockRowClass(status)}`}
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
                    <StockStatusBadge status={status} />
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
      </PanelSectionCard>
    </div>
  );
}
