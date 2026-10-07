type StampRowProps = {
  current: number;
  total: number;
};

export function StampRow({ current, total }: StampRowProps) {
  const filled = Math.min(Math.max(current, 0), total);
  const stamps = Array.from({ length: total }, (_, index) => index < filled);

  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      aria-label={`${filled} de ${total} visitas`}
    >
      {stamps.map((done, index) => (
        <span
          key={index}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
            done
              ? "border-cactus-forest bg-cactus-forest text-white"
              : "border-stone-300 bg-white text-stone-300"
          }`}
        >
          {done ? "✓" : index + 1}
        </span>
      ))}
    </div>
  );
}
