"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/panel", label: "Resumen", exact: true },
  { href: "/panel/reservas", label: "Reservas", exact: false },
  { href: "/panel/inventario", label: "Inventario", exact: false },
];

export function PanelNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
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
