import Image from "next/image";
import { GALLERY_IMAGES } from "@/lib/gallery-images";

export function GallerySection() {
  const [featured, ...rest] = GALLERY_IMAGES;

  return (
    <section id="galeria" className="premium-section mesh-warm px-4 py-14">
      <div className="mx-auto max-w-lg">
        <p className="section-eyebrow text-center">Nuestra cocina</p>
        <h2 className="section-title mt-2 text-center">
          Sabores que enamoran
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-stone-600">
          Desde antojitos clásicos hasta platillos para compartir, cada mesa
          cuenta una historia de tradición y sabor.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl shadow-premium">
            <Image
              src={featured.src}
              alt={featured.alt}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cactus-charcoal/50 to-transparent" />
            <p className="absolute bottom-3 left-4 text-sm font-bold text-white">
              Hecho con cariño
            </p>
          </div>

          {rest.map((image) => (
            <div
              key={image.src}
              className="relative aspect-square overflow-hidden rounded-xl shadow-premium"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 512px) 50vw, 256px"
                className="object-cover transition duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
