import Image from "next/image";
import Link from "next/link";

export function Header({
  variant = "light",
  floating = false,
}: {
  variant?: "light" | "hero";
  floating?: boolean;
}) {
  const isHero = variant === "hero";

  return (
    <header
      className={`${floating ? "fixed inset-x-0" : "sticky"} top-0 z-50 transition-colors ${
        isHero
          ? "border-b border-white/10 bg-cactus-charcoal/75 backdrop-blur-md"
          : "border-b border-cactus-sand/60 bg-cactus-cream/95 shadow-sm backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full p-0.5 shadow-sm ring-2 md:h-14 md:w-14 ${
              isHero
                ? "bg-white/95 ring-cactus-lime/50"
                : "bg-white ring-cactus-lime/40"
            }`}
          >
            <Image
              src="/logo.png"
              alt="El Cactus Antojería"
              width={56}
              height={56}
              className="h-full w-full scale-110 object-contain"
              priority
            />
          </span>
          <div>
            <p
              className={`truncate font-display text-lg font-bold leading-tight md:text-xl ${
                isHero ? "text-white" : "text-cactus-forest"
              }`}
            >
              El Cactus
            </p>
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.25em] ${
                isHero ? "text-cactus-lime" : "text-stone-700"
              }`}
            >
              Antojería
            </p>
          </div>
        </Link>
        <Link
          href="/reservar"
          className="shrink-0 rounded-full bg-gradient-to-r from-cactus-sunset to-cactus-sun px-4 py-2.5 text-sm font-bold text-white shadow-glow-orange transition hover:scale-105 md:px-5"
        >
          Reservar
        </Link>
      </div>
    </header>
  );
}
