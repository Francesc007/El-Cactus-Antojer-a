import type { ReactNode } from "react";

type PanelSectionCardTone = "forest" | "sunset" | "lime" | "neutral";

const toneClasses: Record<PanelSectionCardTone, string> = {
  forest: "border-cactus-forest/35 ring-cactus-forest/10",
  sunset: "border-cactus-sunset/40 ring-cactus-sunset/15",
  lime: "border-cactus-lime/45 ring-cactus-lime/20",
  neutral: "border-cactus-charcoal/15 ring-stone-200/70",
};

type PanelSectionCardProps = {
  children: ReactNode;
  tone?: PanelSectionCardTone;
  className?: string;
};

export function PanelSectionCard({
  children,
  tone = "forest",
  className = "",
}: PanelSectionCardProps) {
  return (
    <div
      className={`premium-card overflow-hidden border-2 ring-1 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
