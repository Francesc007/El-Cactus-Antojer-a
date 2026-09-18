import type { ReactNode } from "react";

type PanelStatCardTone = "forest" | "sunset" | "lime" | "neutral" | "danger" | "warning";

const toneClasses: Record<PanelStatCardTone, string> = {
  forest:
    "border-cactus-forest/35 bg-gradient-to-br from-cactus-forest/20 via-cactus-lime/10 to-white ring-1 ring-cactus-forest/15",
  sunset:
    "border-cactus-sunset/40 bg-gradient-to-br from-cactus-sun/20 via-cactus-sunset/10 to-white ring-1 ring-cactus-sunset/20",
  lime:
    "border-cactus-lime/45 bg-gradient-to-br from-cactus-lime/22 via-cactus-sun/10 to-white ring-1 ring-cactus-lime/25",
  neutral:
    "border-cactus-charcoal/15 bg-gradient-to-br from-stone-200/35 via-cactus-cream/40 to-white ring-1 ring-stone-200/70",
  danger:
    "border-red-300/70 bg-gradient-to-br from-red-200/35 via-red-50/25 to-white ring-1 ring-red-200/60",
  warning:
    "border-amber-300/70 bg-gradient-to-br from-amber-200/35 via-amber-50/25 to-white ring-1 ring-amber-200/60",
};

type PanelStatCardProps = {
  label: string;
  icon?: string;
  tone?: PanelStatCardTone;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PanelStatCard({
  label,
  icon,
  tone = "forest",
  value,
  children,
  className = "",
}: PanelStatCardProps) {
  return (
    <div
      className={`rounded-2xl border-2 p-5 shadow-premium backdrop-blur-sm transition duration-200 ease-out sm:p-6 lg:hover:-translate-y-1 lg:hover:scale-[1.02] lg:hover:shadow-lg ${toneClasses[tone]} ${className}`}
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
        {icon && <span className="text-base normal-case tracking-normal">{icon}</span>}
        {label}
      </p>
      {value !== undefined && (
        <p className="mt-2 font-display text-3xl font-bold sm:text-4xl">{value}</p>
      )}
      {children}
    </div>
  );
}
