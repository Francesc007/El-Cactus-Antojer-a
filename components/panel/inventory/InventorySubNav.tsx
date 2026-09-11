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
    <nav className="flex flex-wrap gap-2 border-b border-cactus-sand/60 pb-4">
      {SUB_NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
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
