type StockStatusBadgeProps = {
  isLow: boolean;
};

export function StockStatusBadge({ isLow }: StockStatusBadgeProps) {
  if (isLow) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Bajo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      OK
    </span>
  );
}
