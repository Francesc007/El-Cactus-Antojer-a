import type { StockStatus } from "./inventory";

const ROW_STATUS_CLASS: Record<StockStatus, string> = {
  low: "bg-red-50/40",
  warning: "bg-amber-50/50",
  ok: "",
};

const STATUS_SORT_ORDER: Record<StockStatus, number> = {
  low: 0,
  warning: 1,
  ok: 2,
};

export function getStockRowClass(status: StockStatus): string {
  return ROW_STATUS_CLASS[status];
}

export function compareStockStatus(a: StockStatus, b: StockStatus): number {
  return STATUS_SORT_ORDER[a] - STATUS_SORT_ORDER[b];
}
