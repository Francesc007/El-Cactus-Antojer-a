import type { StockStatus } from "@/lib/inventory";

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  low: {
    label: "Bajo",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700",
  },
  warning: {
    label: "Atención",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  ok: {
    label: "OK",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700",
  },
};

type StockStatusBadgeProps = {
  status: StockStatus;
};

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ok;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${config.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
