import Image from "next/image";
import type { GalleryImage } from "@/lib/gallery-images";

type PageBannerProps = {
  image: GalleryImage;
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export function PageBanner({
  image,
  title,
  subtitle,
  compact = false,
}: PageBannerProps) {
  return (
    <div
      className={`relative overflow-hidden ${
        compact ? "h-44 sm:h-52" : "h-56 sm:h-64"
      }`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="gradient-hero-overlay absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-3xl font-bold text-white text-shadow-hero sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-md text-sm text-stone-200">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
