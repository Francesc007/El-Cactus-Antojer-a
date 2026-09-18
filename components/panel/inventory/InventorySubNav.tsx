"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_NAV = [
  { href: "/panel/inventario", label: "Dashboard", exact: true },
  { href: "/panel/inventario/productos", label: "Productos", exact: false },
  { href: "/panel/inventario/movimientos", label: "Movimientos", exact: false },
];

export function InventorySubNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-cactus-sand/60 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {SUB_NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-cactus-forest text-white shadow-glow-green"
                : "bg-white text-stone-600 ring-1 ring-cactus-sand hover:text-cactus-forest"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
