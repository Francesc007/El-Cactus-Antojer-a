"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelNav } from "./PanelNav";

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm ring-2 ring-cactus-lime/50 lg:h-16 lg:w-16">
            <Image
              src="/logo.png"
              alt="El Cactus"
              width={64}
              height={64}
              className="h-full w-full scale-110 object-contain"
            />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold leading-tight text-white">
              El Cactus Antojería
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cactus-lime/80">
              Panel del negocio
            </p>
          </div>
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <PanelNav onNavigate={() => setMenuOpen(false)} />
      </div>
      <div className="space-y-2 border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="block text-sm font-semibold text-white/80 transition hover:text-white"
        >
          Cerrar sesión
        </button>
        <Link
          href="/"
          className="text-xs text-cactus-lime/70 transition hover:text-cactus-lime"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );

  return (
    <div className="mesh-warm flex h-[100dvh] max-w-[100vw] overflow-hidden">
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden gradient-forest text-white shadow-xl lg:flex">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-cactus-charcoal/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col overflow-hidden gradient-forest text-white shadow-2xl">
            <div className="flex items-center justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80"
              >
                Cerrar
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-cactus-sand/60 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cactus-forest/20 bg-cactus-forest text-white shadow-sm"
          >
            <span className="sr-only">Menú</span>
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-4 rounded bg-white" />
              <span className="block h-0.5 w-4 rounded bg-white" />
              <span className="block h-0.5 w-4 rounded bg-white" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-cactus-forest-dark">
              El Cactus Antojería
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cactus-forest/70">
              Panel del negocio
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-cactus-lime/50">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="scale-110 object-contain"
            />
          </span>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl min-w-0">{children}</div>
        </main>

        <nav
          aria-label="Secciones del panel"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-cactus-sand/70 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(26,61,24,0.08)] backdrop-blur-md lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          <PanelNav variant="tabs" />
        </nav>
      </div>
    </div>
  );
}
