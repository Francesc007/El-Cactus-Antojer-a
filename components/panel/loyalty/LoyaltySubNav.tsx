"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/panel/clientes/escanear", label: "Escanear" },
  { href: "/panel/clientes/cumpleanos", label: "Cumpleaños" },
  { href: "/panel/clientes/configuracion", label: "Configuración" },
];

export function LoyaltySubNav() {
  const pathname = usePathname();
  const clientesActive =
    pathname === "/panel/clientes" ||
    (pathname.startsWith("/panel/clientes/") &&
      !LINKS.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)));

  return (
    <nav className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-cactus-sand/60 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/panel/clientes"
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          clientesActive
            ? "bg-cactus-forest text-white shadow-glow-green"
            : "bg-white text-stone-600 ring-1 ring-cactus-sand hover:text-cactus-forest"
        }`}
      >
        Clientes
      </Link>
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-cactus-forest text-white shadow-glow-green"
                : "bg-white text-stone-600 ring-1 ring-cactus-sand hover:text-cactus-forest"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
