"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    <section className="relative min-h-[88vh] overflow-hidden">
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
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

      <div className="relative z-10 flex min-h-[88vh] flex-col items-center justify-end px-4 pb-12 pt-28 text-center">
        <p className="section-eyebrow text-cactus-lime">Antojería mexicana</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-white text-shadow-hero sm:text-5xl">
          El Cactus
        </h1>
        <p className="mt-1 text-lg font-semibold uppercase tracking-[0.35em] text-cactus-lime/90">
          Antojería
        </p>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-stone-200">
          Sabores auténticos, ambiente cálido y platillos que celebran lo mejor
          de la cocina mexicana.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link href="/reservar" className="btn-primary w-full">
            Reservar mesa
          </Link>
          <a
            href="#galeria"
            className="rounded-2xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Ver platillos
          </a>
        </div>

        <div className="mt-8 flex gap-2">
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
