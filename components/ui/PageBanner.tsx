import Image from "next/image";
import type { GalleryImage } from "@/lib/gallery-images";

type PageBannerProps = {
  image: GalleryImage;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  /** Muestra la imagen destacada (ej. mural con nombre del negocio). */
  variant?: "default" | "showcase";
};

export function PageBanner({
  image,
  title,
  subtitle,
  compact = false,
  variant = "default",
}: PageBannerProps) {
  const isShowcase = variant === "showcase";

  return (
    <div
      className={`relative overflow-hidden ${
        isShowcase
          ? "h-72 sm:h-80"
          : compact
            ? "h-44 sm:h-52"
            : "h-56 sm:h-64"
      }`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="100vw"
        className={
          isShowcase
            ? "object-cover object-[32%_42%] sm:object-[28%_40%]"
            : "object-cover"
        }
        priority
      />
      <div
        className={
          isShowcase
            ? "absolute inset-0 bg-gradient-to-t from-cactus-charcoal/70 via-cactus-charcoal/10 to-transparent"
            : "gradient-hero-overlay absolute inset-0"
        }
      />
      {(title || subtitle) && (
        <div
          className={`absolute inset-0 flex flex-col px-4 text-center ${
            isShowcase
              ? "items-center justify-end pb-6"
              : "items-center justify-center"
          }`}
        >
          {title && (
            <h1 className="font-display text-3xl font-bold text-white text-shadow-hero sm:text-4xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 max-w-md text-sm text-stone-200">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
