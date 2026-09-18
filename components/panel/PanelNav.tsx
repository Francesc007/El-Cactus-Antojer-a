"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/panel", label: "Resumen", icon: "📊", exact: true },
  { href: "/panel/reservas", label: "Reservas", icon: "📅", exact: false },
  { href: "/panel/inventario", label: "Inventario", icon: "📦", exact: false },
];

type PanelNavProps = {
  variant?: "sidebar" | "tabs";
  onNavigate?: () => void;
};

export function PanelNav({ variant = "sidebar", onNavigate }: PanelNavProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  if (variant === "tabs") {
    return (
      <div className="grid grid-cols-3 gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center rounded-xl px-2 py-2 text-[11px] font-bold transition ${
                active
                  ? "bg-cactus-forest/10 text-cactus-forest"
                  : "text-stone-500"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-white/15 text-white shadow-sm ring-1 ring-cactus-lime/30"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
