import Image from "next/image";
import Link from "next/link";

export function Header({ variant = "light" }: { variant?: "light" | "hero" }) {
  const isHero = variant === "hero";

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        isHero
          ? "border-b border-white/10 bg-cactus-charcoal/40 backdrop-blur-md"
          : "border-b border-cactus-sand/60 bg-cactus-cream/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="El Cactus Antojería"
            width={48}
            height={48}
            className="rounded-full ring-2 ring-cactus-lime/30"
            priority
          />
          <div>
            <p
              className={`font-display text-lg font-bold leading-tight ${
                isHero ? "text-white" : "text-cactus-forest"
              }`}
            >
              El Cactus
            </p>
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.25em] ${
                isHero
                  ? "text-cactus-charcoal drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
                  : "text-stone-700"
              }`}
            >
              Antojería
            </p>
          </div>
        </Link>
        <Link
          href="/reservar"
          className="rounded-full bg-gradient-to-r from-cactus-sunset to-cactus-sun px-4 py-2 text-sm font-bold text-white shadow-glow-orange transition hover:scale-105"
        >
          Reservar
        </Link>
      </div>
    </header>
  );
}
