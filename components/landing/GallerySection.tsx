import Image from "next/image";
import { GALLERY_IMAGES } from "@/lib/gallery-images";

function GalleryImage({
  image,
  sizes,
  rounded = "rounded-2xl",
  className = "aspect-[16/10]",
}: {
  image: (typeof GALLERY_IMAGES)[number];
  sizes: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden shadow-premium ${rounded} ${className}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="object-cover transition duration-500 hover:scale-105"
      />
    </div>
  );
}

export function GallerySection() {
  const featured = GALLERY_IMAGES[0];
  const middle = GALLERY_IMAGES.slice(1, -1);
  const closing = GALLERY_IMAGES[GALLERY_IMAGES.length - 1];

  return (
    <section id="galeria" className="premium-section scroll-mt-24 px-4 pb-16 pt-28 md:scroll-mt-28 md:px-8 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center md:mx-0 md:max-w-2xl md:text-left">
          <p className="section-eyebrow">Nuestra cocina</p>
          <h2 className="section-title mt-2 md:text-5xl">
            Sabores que enamoran
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 md:max-w-md md:text-base">
            Desde antojitos clásicos hasta platillos para compartir, cada mesa
            cuenta una historia de tradición y sabor.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:grid-cols-6 md:gap-4">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl shadow-premium md:col-span-4 md:row-span-2 md:aspect-auto md:min-h-[32rem]">
            <Image
              src={featured.src}
              alt={featured.alt}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover transition duration-500 hover:scale-105 motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cactus-charcoal/55 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 text-sm font-bold text-white md:bottom-6 md:left-6 md:text-base">
              Hecho con cariño
            </p>
          </div>

          {middle.map((image, index) => (
            <GalleryImage
              key={image.src}
              image={image}
              sizes="(max-width: 768px) 50vw, 30vw"
              className={
                index < 2
                  ? "aspect-[16/10] md:col-span-2 md:aspect-auto md:h-full md:min-h-[15rem]"
                  : "aspect-[16/10] md:col-span-2"
              }
            />
          ))}

          <GalleryImage
            image={closing}
            sizes="(max-width: 768px) 100vw, 30vw"
            className="col-span-2 aspect-[16/10] md:col-span-2"
          />
        </div>
      </div>
    </section>
  );
}
