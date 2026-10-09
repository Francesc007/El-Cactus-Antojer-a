type StampRowProps = {
  current: number;
  total: number;
};

export function StampRow({ current, total }: StampRowProps) {
  const filled = Math.min(Math.max(current, 0), total);
  const stamps = Array.from({ length: total }, (_, index) => index < filled);

  return (
    <div
      className="mx-auto w-full max-w-[17rem]"
      role="group"
      aria-label={`${filled} de ${total} visitas`}
    >
      <div
        className="grid w-full gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {stamps.map((done, index) => (
          <span
            key={index}
            className={`flex aspect-square w-full max-h-9 items-center justify-center rounded-full border-2 text-[11px] font-bold sm:text-xs ${
              done
                ? "border-cactus-forest bg-cactus-forest text-white"
                : "border-stone-300 bg-white text-stone-400"
            }`}
          >
            {done ? "✓" : index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
