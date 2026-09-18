"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelNav } from "./PanelNav";

export function PanelSidebar() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col gradient-forest text-white shadow-xl">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm ring-2 ring-cactus-lime/50">
            <Image
              src="/logo.png"
              alt="El Cactus"
              width={64}
              height={64}
              className="h-full w-full scale-110 object-contain"
            />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-white">
              El Cactus Antojería
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cactus-lime/80">
              Panel del negocio
            </p>
          </div>
        </Link>
      </div>
      <div className="flex-1 px-3 py-4">
        <PanelNav />
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
    </aside>
  );
}
