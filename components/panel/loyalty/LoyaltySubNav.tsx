"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/panel/clientes", label: "Clientes", emoji: "👥" },
  { href: "/panel/clientes/escanear", label: "Escanear", emoji: "📷" },
  { href: "/panel/clientes/cumpleanos", label: "Cumpleaños", emoji: "🎂" },
  { href: "/panel/clientes/configuracion", label: "Configuración", emoji: "⚙️" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/panel/clientes") {
    return (
      pathname === "/panel/clientes" ||
      (pathname.startsWith("/panel/clientes/") &&
        !SECTIONS.slice(1).some((s) => pathname === s.href || pathname.startsWith(`${s.href}/`)))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LoyaltySubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label="Secciones de tarjeta VIP"
    >
      {SECTIONS.map((section) => {
        const active = isActive(pathname, section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={`rounded-2xl border-2 p-4 text-center shadow-premium backdrop-blur-sm transition duration-200 ease-out sm:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-lg ${
              active
                ? "border-cactus-forest/35 bg-gradient-to-br from-cactus-forest/20 via-cactus-lime/10 to-white ring-1 ring-cactus-forest/15"
                : "border-cactus-charcoal/15 bg-gradient-to-br from-stone-200/35 via-cactus-cream/40 to-white ring-1 ring-stone-200/70"
            }`}
          >
            <span className="block text-2xl sm:text-3xl" aria-hidden>
              {section.emoji}
            </span>
            <span
              className={`mt-2 block text-sm font-bold ${active ? "text-cactus-forest" : "text-stone-600"}`}
            >
              {section.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
