"use client";

import { useState } from "react";

type LoyaltyPhotoProps = {
  src: string | null;
  name: string;
  progress?: number;
  size?: "sm" | "lg" | "xs";
  /** Solo inicial en círculo (listado del panel). */
  initialOnly?: boolean;
};

function displayInitial(name: string): string {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  const first = space === -1 ? trimmed : trimmed.slice(0, space);
  return first.slice(0, 1).toUpperCase() || "?";
}

export function LoyaltyPhoto({
  src,
  name,
  progress,
  size = "sm",
  initialOnly = false,
}: LoyaltyPhotoProps) {
  const [shownSrc, setShownSrc] = useState<string | null>(null);
  const boxSize = size === "lg" ? "h-28 w-28" : size === "xs" ? "h-12 w-12" : "h-16 w-16";
  const initialText = size === "lg" ? "text-2xl" : size === "xs" ? "text-sm" : "text-lg";
  const showPhoto = !initialOnly && Boolean(src);
  const ready = showPhoto && shownSrc === src;

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${boxSize}`}>
      {!ready && (
        <div
          className={`flex ${boxSize} ${initialText} items-center justify-center rounded-full bg-gradient-to-br from-cactus-forest/15 to-cactus-lime/20 font-bold text-cactus-forest ring-2 ring-cactus-forest/10`}
        >
          {displayInitial(name)}
        </div>
      )}
      {showPhoto && src && (
        // La URL firmada cambia y caduca; el optimizador de imágenes no debe guardarla.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          decoding="async"
          fetchPriority={size === "lg" ? "high" : "low"}
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) {
              setShownSrc(src);
            }
          }}
          onLoad={() => setShownSrc(src)}
          className={`${boxSize} rounded-full object-cover ${ready ? "relative" : "absolute inset-0 opacity-0"}`}
        />
      )}
      {progress !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center rounded-full bg-cactus-sunset font-bold text-white ring-2 ring-white ${
            size === "xs" ? "h-5 min-w-5 px-0.5 text-[10px]" : "h-6 min-w-6 px-1 text-xs"
          }`}
        >
          {progress}
        </span>
      )}
    </div>
  );
}
