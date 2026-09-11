import type { ReservationStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Llegó",
    className: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-stone-200 text-stone-600",
  },
  no_show: {
    label: "No llegó",
    className: "bg-red-100 text-red-800",
  },
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
