"use client";

import { useEffect, useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { todayStr } from "@/lib/dates";
import { PanelSectionCard } from "@/components/panel/PanelSectionCard";
import { DatePicker } from "@/components/ui/DatePicker";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import type { StockMovement } from "@/lib/types";

const PAGE_SIZE = 10;

export default function InventarioMovimientosPage() {
  const { products, addMovement, getFilteredMovements, getStock } = useInventory();

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [filterProductId, setFilterProductId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);

  async function loadMovements(page = currentPage) {
    setLoadingList(true);
    try {
      const result = await getFilteredMovements({
        productId: filterProductId || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setMovements(result.movements);
      setTotal(result.total);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void loadMovements(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProductId, filterDateFrom, filterDateTo, currentPage, getFilteredMovements]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function getProductName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "—";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || quantity <= 0) return;
    setFormError(null);
    try {
      const result = await addMovement({
        productId,
        type,
        quantity,
        date,
        note: note.trim() || undefined,
      });
      if (result.lowStockMessage) {
        setToastMessage(result.lowStockMessage);
      }
      setQuantity(1);
      setNote("");
      setCurrentPage(1);
      await loadMovements(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo registrar el movimiento");
    }
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PanelSectionCard tone="forest" className="p-5">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <h2 className="font-display text-lg font-bold text-cactus-charcoal">
            Registrar movimiento
          </h2>
          {formError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}
          <div>
            <label htmlFor="mov-product" className="text-sm font-semibold">
              Producto
            </label>
            <select
              id="mov-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="input-premium mt-1"
            >
              <option value="">Seleccionar…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {getStock(p.id)} {p.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mov-type" className="text-sm font-semibold">
                Tipo
              </label>
              <select
                id="mov-type"
                value={type}
                onChange={(e) => setType(e.target.value as "in" | "out")}
                className="input-premium mt-1"
              >
                <option value="in">Entrada</option>
                <option value="out">Salida</option>
              </select>
            </div>
            <div>
              <label htmlFor="mov-qty" className="text-sm font-semibold">
                Cantidad
              </label>
              <input
                id="mov-qty"
                type="number"
                min={0.1}
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="input-premium mt-1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="mov-date" className="text-sm font-semibold">
              Fecha
            </label>
            <DatePicker
              id="mov-date"
              value={date}
              onChange={setDate}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="mov-note" className="text-sm font-semibold">
              Nota (opcional)
            </label>
            <input
              id="mov-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Compra semanal, merma…"
              className="input-premium mt-1"
            />
          </div>
          <button type="submit" className="btn-secondary w-full py-3 text-sm">
            Registrar {type === "in" ? "entrada" : "salida"}
          </button>
          </form>
        </PanelSectionCard>

        <PanelSectionCard tone="sunset" className="p-5">
          <h2 className="font-display text-lg font-bold text-cactus-charcoal">
            Filtrar historial
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="filt-product" className="text-sm font-semibold">
                Producto
              </label>
              <select
                id="filt-product"
                value={filterProductId}
                onChange={(e) => {
                  setFilterProductId(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-premium mt-1"
              >
                <option value="">Todos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="filt-from" className="text-sm font-semibold">
                  Desde
                </label>
                <DatePicker
                  id="filt-from"
                  value={filterDateFrom}
                  onChange={(nextDate) => {
                    setFilterDateFrom(nextDate);
                    setCurrentPage(1);
                  }}
                  placeholder="Cualquier fecha"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="filt-to" className="text-sm font-semibold">
                  Hasta
                </label>
                <DatePicker
                  id="filt-to"
                  value={filterDateTo}
                  onChange={(nextDate) => {
                    setFilterDateTo(nextDate);
                    setCurrentPage(1);
                  }}
                  placeholder="Cualquier fecha"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </PanelSectionCard>
      </div>

      <PanelSectionCard tone="lime" className="mt-6">
        <div className="border-b border-cactus-sand/60 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-cactus-charcoal">
            Historial de movimientos
          </h2>
          <p className="text-sm text-stone-500">
            {total} {total === 1 ? "registro" : "registros"}
          </p>
        </div>
        {loadingList ? (
          <p className="p-8 text-center text-stone-500">Cargando historial…</p>
        ) : movements.length === 0 ? (
          <p className="p-8 text-center text-stone-500">
            No hay movimientos con estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-cactus-sand/60 bg-stone-50/80">
              <tr>
                <th className="px-5 py-3 font-semibold text-stone-600">Fecha</th>
                <th className="px-5 py-3 font-semibold text-stone-600">Producto</th>
                <th className="px-5 py-3 font-semibold text-stone-600">Tipo</th>
                <th className="px-5 py-3 font-semibold text-stone-600">Cantidad</th>
                <th className="px-5 py-3 font-semibold text-stone-600">Nota</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => (
                <tr key={mov.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-5 py-3 font-mono">{mov.date}</td>
                  <td className="px-5 py-3 font-medium">{getProductName(mov.productId)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        mov.type === "in"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {mov.type === "in" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono font-semibold">
                    {mov.type === "in" ? "+" : "−"}
                    {mov.quantity}
                  </td>
                  <td className="px-5 py-3 text-stone-500">{mov.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {total > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        )}
      </PanelSectionCard>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
