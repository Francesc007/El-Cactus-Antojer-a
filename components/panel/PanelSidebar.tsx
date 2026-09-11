import Image from "next/image";
import Link from "next/link";
import { PanelNav } from "./PanelNav";

export function PanelSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col gradient-forest text-white shadow-xl">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="El Cactus"
            width={44}
            height={44}
            className="rounded-full ring-2 ring-cactus-lime/40"
          />
          <div>
            <p className="font-display text-sm font-bold text-white">
              El Cactus
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
      <div className="border-t border-white/10 px-5 py-4">
        <Link
          href="/"
          className="text-xs text-cactus-lime/70 transition hover:text-cactus-lime"
        >
          ← Volver al sitio público
        </Link>
      </div>
    </aside>
  );
}
