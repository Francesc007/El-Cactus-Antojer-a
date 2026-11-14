"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewButton } from "@/components/reviews/ReviewButton";
import { HERO_IMAGES } from "@/lib/gallery-images";

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div className="gradient-hero-overlay absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-end px-5 pb-8 pt-24 text-center md:items-start md:px-8 md:pb-14 md:pt-28 md:text-left">
        <p className="section-eyebrow text-cactus-lime">Antojería mexicana</p>
        <h1 className="mt-3 max-w-full font-display text-5xl font-extrabold leading-[0.95] text-white text-shadow-hero sm:text-6xl lg:text-7xl">
          El Cactus
        </h1>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.28em] text-cactus-lime/90 sm:text-base sm:tracking-[0.38em]">
          Antojería
        </p>
        <p className="mt-5 max-w-md text-base leading-relaxed text-stone-100 md:max-w-lg md:text-lg">
          Sabores auténticos, ambiente cálido y platillos que celebran lo mejor
          de la cocina mexicana.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 md:max-w-none md:flex-row md:flex-wrap md:items-center">
          <Link href="/reservar" className="btn-primary w-full md:w-auto">
            Reservar mesa
          </Link>
          <Link
            href="/tarjeta"
            className="rounded-2xl border border-cactus-sun/80 bg-cactus-sun/20 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-cactus-sun/30 md:py-4"
          >
            Genera tu tarjeta VIP
          </Link>
          <ReviewButton />
        </div>

        <div className="mt-8 flex gap-2 md:mt-10">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Imagen ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-8 bg-cactus-sun"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
