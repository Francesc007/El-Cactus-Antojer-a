"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { calculateStock, isLowStock } from "@/lib/inventory";
import {
  getInitialMovements,
  getInitialProducts,
} from "@/lib/inventory-mock-data";
import type {
  MovementFilters,
  NewMovementInput,
  NewProductInput,
  Product,
  StockMovement,
  UpdateProductInput,
} from "@/lib/types";

type InventoryContextValue = {
  products: Product[];
  movements: StockMovement[];
  getStock: (productId: string) => number;
  isProductLowStock: (productId: string) => boolean;
  addProduct: (input: NewProductInput) => Product;
  updateProduct: (id: string, input: UpdateProductInput) => void;
  addMovement: (input: NewMovementInput) => {
    movement: StockMovement;
    triggeredLowStock: boolean;
    stockAfter: number;
  };
  getFilteredMovements: (filters: MovementFilters) => StockMovement[];
  lowStockProducts: Product[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [movements, setMovements] = useState<StockMovement[]>(
    getInitialMovements
  );

  const getStock = useCallback(
    (productId: string) => calculateStock(productId, movements),
    [movements]
  );

  const isProductLowStock = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return false;
      return isLowStock(product, calculateStock(productId, movements));
    },
    [products, movements]
  );

  const addProduct = useCallback((input: NewProductInput): Product => {
    const product: Product = {
      id: `prod-${Date.now()}`,
      name: input.name.trim(),
      unit: input.unit.trim(),
      minStock: input.minStock,
    };
    setProducts((prev) => [...prev, product]);
    return product;
  }, []);

  const updateProduct = useCallback((id: string, input: UpdateProductInput) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...(input.name !== undefined && { name: input.name.trim() }),
              ...(input.unit !== undefined && { unit: input.unit.trim() }),
              ...(input.minStock !== undefined && { minStock: input.minStock }),
            }
          : p
      )
    );
  }, []);

  const addMovement = useCallback(
    (input: NewMovementInput) => {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        date: input.date,
        note: input.note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      setMovements((prev) => [...prev, movement]);

      const product = products.find((p) => p.id === input.productId);
      const stockAfter = calculateStock(input.productId, [
        ...movements,
        movement,
      ]);
      const triggeredLowStock = product
        ? isLowStock(product, stockAfter)
        : false;

      return { movement, triggeredLowStock, stockAfter };
    },
    [products, movements]
  );

  const getFilteredMovements = useCallback(
    (filters: MovementFilters) => {
      return movements
        .filter((m) => {
          if (filters.productId && m.productId !== filters.productId) {
            return false;
          }
          if (filters.dateFrom && m.date < filters.dateFrom) return false;
          if (filters.dateTo && m.date > filters.dateTo) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    },
    [movements]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => isLowStock(p, calculateStock(p.id, movements))),
    [products, movements]
  );

  const value = useMemo(
    () => ({
      products,
      movements,
      getStock,
      isProductLowStock,
      addProduct,
      updateProduct,
      addMovement,
      getFilteredMovements,
      lowStockProducts,
    }),
    [
      products,
      movements,
      getStock,
      isProductLowStock,
      addProduct,
      updateProduct,
      addMovement,
      getFilteredMovements,
      lowStockProducts,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return ctx;
}
