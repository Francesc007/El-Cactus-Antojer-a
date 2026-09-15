import { BUSINESS_INFO } from "@/lib/business-info";
import { PrivacyLink } from "@/components/ui/PrivacyLink";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-cactus-charcoal px-4 py-10 text-stone-400">
      <div className="absolute inset-0 bg-gradient-to-br from-cactus-forest-dark/40 to-transparent" />
      <div className="relative mx-auto max-w-lg text-center text-sm">
        <p className="font-display text-xl font-bold gradient-cactus-text">
          {BUSINESS_INFO.name}
        </p>
        <a
          href={BUSINESS_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block leading-relaxed transition hover:text-cactus-lime"
        >
          {BUSINESS_INFO.address.line1}
          <br />
          {BUSINESS_INFO.address.line2}, {BUSINESS_INFO.address.city}
        </a>

        <div className="mt-6">
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
