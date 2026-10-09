import Link from "next/link";
import { LoyaltyCardActions } from "@/components/loyalty/LoyaltyCardActions";
import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { StampRow } from "@/components/loyalty/StampRow";
import type { PublicLoyaltyCard } from "@/lib/types";

type PublicCardProps = {
  card: PublicLoyaltyCard;
  qrDataUrl: string | null;
};

export function PublicCard({ card, qrDataUrl }: PublicCardProps) {
  return (
    <article className="premium-card relative mx-auto max-w-sm p-6 text-center">
      <Link
        href="/"
        aria-label="Cerrar y volver al inicio"
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-xl font-bold leading-none text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-200 hover:text-cactus-charcoal"
      >
        ×
      </Link>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="El Cactus Antojería"
        className="mx-auto h-20 w-20 object-contain"
      />
      <p className="section-eyebrow mt-3">Tarjeta VIP</p>
      <h1 className="section-title mt-2">{card.firstName}</h1>
      <p className="mt-1 font-mono text-sm font-bold tracking-widest text-stone-500">
        Folio {card.folio}
      </p>
      <div className="mt-5 flex justify-center">
        <LoyaltyPhoto src={card.photoUrl} name={card.firstName} size="lg" />
      </div>
      <div className="mt-6">
        <StampRow current={card.currentVisits} total={card.visitsPerReward} />
      </div>
      {qrDataUrl ? (
        <div className="mx-auto mt-6 w-fit rounded-2xl border-4 border-cactus-forest bg-white p-2">
          {/* El QR se genera en el momento como imagen local. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Código QR de tu tarjeta VIP" className="h-52 w-52" />
        </div>
      ) : (
        <p className="mt-6 break-all text-xs text-stone-500">{card.cardUrl}</p>
      )}
      <LoyaltyCardActions
        firstName={card.firstName}
        folio={card.folio}
        phone={card.phone}
        cardUrl={card.cardUrl}
        qrDataUrl={qrDataUrl}
      />
    </article>
  );
}
