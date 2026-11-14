import { BUSINESS_INFO } from "@/lib/business-info";
import { PrivacyLink } from "@/components/ui/PrivacyLink";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-cactus-charcoal px-4 py-12 text-stone-400 md:px-8 md:py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-cactus-forest-dark/50 to-transparent" />
      <div className="relative mx-auto max-w-6xl text-center text-sm md:text-left">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-2xl font-bold gradient-cactus-text md:text-3xl">
              {BUSINESS_INFO.name}
            </p>
            <a
              href={BUSINESS_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block max-w-sm leading-relaxed transition hover:text-cactus-lime"
            >
              {BUSINESS_INFO.address.line1}
              <br />
              {BUSINESS_INFO.address.line2}, {BUSINESS_INFO.address.city}
            </a>
          </div>

          <SocialLinks variant="light" size="sm" />
        </div>

        <p className="mt-6">
          <PrivacyLink className="text-xs uppercase tracking-widest text-stone-500 transition hover:text-cactus-lime">
            Aviso de privacidad
          </PrivacyLink>
        </p>
        <div
          className="mt-4 flex flex-col items-center justify-between gap-2 text-xs text-stone-600 sm:flex-row"
          suppressHydrationWarning
        >
          <p>
            Powered by{" "}
            <a
              href="https://www.sigmaaiagency.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-cactus-lime"
            >
              Sigma AI Agency
            </a>
            {" | Automatización Inteligente"}
          </p>
          <p>
            © {new Date().getFullYear()} {BUSINESS_INFO.name}. Todos los
            derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
