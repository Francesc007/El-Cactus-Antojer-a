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
  const boxSize = size === "lg" ? "h-28 w-28" : size === "xs" ? "h-12 w-12" : "h-16 w-16";
  const initialText =
    size === "lg" ? "text-2xl" : size === "xs" ? "text-sm" : "text-lg";

  return (
    <div className={`relative shrink-0 ${boxSize}`}>
      {!initialOnly && src ? (
        // La URL firmada cambia y caduca; el optimizador de imágenes no debe guardarla.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={`${boxSize} rounded-full object-cover`} />
      ) : (
        <div
          className={`flex ${boxSize} ${initialText} items-center justify-center rounded-full bg-gradient-to-br from-cactus-forest/15 to-cactus-lime/20 font-bold text-cactus-forest ring-2 ring-cactus-forest/10`}
        >
          {displayInitial(name)}
        </div>
      )}
      {progress !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-cactus-sunset font-bold text-white ring-2 ring-white ${
            size === "xs" ? "h-5 min-w-5 px-0.5 text-[10px]" : "h-6 min-w-6 px-1 text-xs"
          }`}
        >
          {progress}
        </span>
      )}
    </div>
  );
}
