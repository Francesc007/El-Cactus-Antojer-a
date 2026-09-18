import { getStockStatus, type StockStatus } from "@/lib/inventory";
import { compareStockStatus } from "@/lib/inventory-ui";
import type { ProductWithStock } from "@/lib/types";

export type StockReportItem = {
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  status: StockStatus;
};

export type StockReportSection = {
  status: StockStatus;
  title: string;
  subtitle: string;
  items: StockReportItem[];
};

export type StockReportData = {
  businessName: string;
  generatedAt: string;
  generatedAtLabel: string;
  sections: StockReportSection[];
  totals: {
    products: number;
    low: number;
    warning: number;
    ok: number;
  };
};

const SECTION_META: Record<
  StockStatus,
  { title: string; subtitle: string }
> = {
  low: {
    title: "Stock bajo",
    subtitle: "Requiere compra pronto",
  },
  warning: {
    title: "En atención",
    subtitle: "Cerca del mínimo",
  },
  ok: {
    title: "Stock OK",
    subtitle: "Nivel adecuado",
  },
};

const STATUS_ORDER: StockStatus[] = ["low", "warning", "ok"];

export function buildStockReport(
  products: ProductWithStock[],
  businessName: string,
  generatedAt = new Date()
): StockReportData {
  const items: StockReportItem[] = products.map((product) => ({
    name: product.name,
    stock: product.stock,
    minStock: product.minStock,
    unit: product.unit,
    status: getStockStatus(product, product.stock),
  }));

  items.sort((a, b) => {
    const byStatus = compareStockStatus(a.status, b.status);
    if (byStatus !== 0) return byStatus;
    return a.name.localeCompare(b.name, "es");
  });

  const sections = STATUS_ORDER.map((status) => ({
    status,
    ...SECTION_META[status],
    items: items.filter((item) => item.status === status),
  }));

  return {
    businessName,
    generatedAt: generatedAt.toISOString(),
    generatedAtLabel: generatedAt.toLocaleString("es-MX", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    sections,
    totals: {
      products: items.length,
      low: items.filter((i) => i.status === "low").length,
      warning: items.filter((i) => i.status === "warning").length,
      ok: items.filter((i) => i.status === "ok").length,
    },
  };
}

export function stockReportFilename(generatedAt = new Date()): string {
  const date = generatedAt.toISOString().slice(0, 10);
  return `stock-el-cactus-${date}.pdf`;
}
