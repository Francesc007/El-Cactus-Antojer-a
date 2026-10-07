type LoyaltyPhotoProps = {
  src: string | null;
  name: string;
  progress?: number;
  size?: "sm" | "lg";
};

export function LoyaltyPhoto({ src, name, progress, size = "sm" }: LoyaltyPhotoProps) {
  const dimension = size === "lg" ? "h-28 w-28" : "h-16 w-16";

  return (
    <div className={`relative shrink-0 ${dimension}`}>
      {src ? (
        // La URL firmada cambia y caduca; el optimizador de imágenes no debe guardarla.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={`${dimension} rounded-full object-cover`} />
      ) : (
        <div
          className={`flex ${dimension} items-center justify-center rounded-full bg-cactus-forest/10 text-lg font-bold text-cactus-forest`}
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      {progress !== undefined && (
        <span className="absolute -top-1 left-1/2 flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full bg-cactus-sunset px-1 text-xs font-bold text-white ring-2 ring-white">
          {progress}
        </span>
      )}
    </div>
  );
}
