"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api-client";
import { getStockStatus, isLowStock, type StockStatus } from "@/lib/inventory";
import type {
  MovementFilters,
  NewMovementInput,
  NewProductInput,
  ProductWithStock,
  StockMovement,
  UpdateProductInput,
} from "@/lib/types";

type InventoryContextValue = {
  products: ProductWithStock[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStock: (productId: string) => number;
  getProductStockStatus: (productId: string) => StockStatus;
  isProductLowStock: (productId: string) => boolean;
  addProduct: (input: NewProductInput) => Promise<ProductWithStock>;
  updateProduct: (id: string, input: UpdateProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMovement: (input: NewMovementInput) => Promise<{
    movement: StockMovement;
    triggeredLowStock: boolean;
    stockAfter: number;
    lowStockMessage: string | null;
  }>;
  getFilteredMovements: (filters: MovementFilters) => Promise<{
    movements: StockMovement[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  lowStockProducts: ProductWithStock[];
  warningStockProducts: ProductWithStock[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ products: ProductWithStock[] }>(
        "/api/inventory/products"
      );
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getStock = useCallback(
    (productId: string) => products.find((p) => p.id === productId)?.stock ?? 0,
    [products]
  );

  const getProductStockStatus = useCallback(
    (productId: string): StockStatus => {
      const product = products.find((p) => p.id === productId);
      if (!product) return "ok";
      return getStockStatus(product, product.stock);
    },
    [products]
  );

  const isProductLowStock = useCallback(
    (productId: string) => getProductStockStatus(productId) === "low",
    [getProductStockStatus]
  );

  const addProduct = useCallback(async (input: NewProductInput) => {
    const data = await apiRequest<{ product: ProductWithStock }>(
      "/api/inventory/products",
      { method: "POST", body: JSON.stringify(input) }
    );
    setProducts((prev) => [...prev, data.product].sort((a, b) => a.name.localeCompare(b.name)));
    return data.product;
  }, []);

  const updateProduct = useCallback(async (id: string, input: UpdateProductInput) => {
    const data = await apiRequest<{ product: ProductWithStock }>(
      `/api/inventory/products/${id}`,
      { method: "PATCH", body: JSON.stringify(input) }
    );
    setProducts((prev) => prev.map((item) => (item.id === id ? data.product : item)));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await apiRequest<{ ok: true }>(`/api/inventory/products/${id}`, {
      method: "DELETE",
    });
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addMovement = useCallback(async (input: NewMovementInput) => {
    const data = await apiRequest<{
      movement: StockMovement;
      triggeredLowStock: boolean;
      stockAfter: number;
      lowStockMessage: string | null;
    }>("/api/inventory/movements", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await refresh();
    return data;
  }, [refresh]);

  const getFilteredMovements = useCallback(async (filters: MovementFilters) => {
    const params = new URLSearchParams();
    if (filters.productId) params.set("productId", filters.productId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    params.set("page", String(filters.page ?? 1));
    params.set("pageSize", String(filters.pageSize ?? 10));
    return apiRequest<{
      movements: StockMovement[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/inventory/movements?${params.toString()}`);
  }, []);

  const lowStockProducts = useMemo(
    () => products.filter((p) => isLowStock(p, p.stock)),
    [products]
  );

  const warningStockProducts = useMemo(
    () => products.filter((p) => getStockStatus(p, p.stock) === "warning"),
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      refresh,
      getStock,
      getProductStockStatus,
      isProductLowStock,
      addProduct,
      updateProduct,
      deleteProduct,
      addMovement,
      getFilteredMovements,
      lowStockProducts,
      warningStockProducts,
    }),
    [
      products,
      loading,
      error,
      refresh,
      getStock,
      getProductStockStatus,
      isProductLowStock,
      addProduct,
      updateProduct,
      deleteProduct,
      addMovement,
      getFilteredMovements,
      lowStockProducts,
      warningStockProducts,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return ctx;
}
