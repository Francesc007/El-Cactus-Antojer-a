import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { StampRow } from "@/components/loyalty/StampRow";
import type { PublicLoyaltyCard } from "@/lib/types";

type PublicCardProps = {
  card: PublicLoyaltyCard;
  qrDataUrl: string | null;
};

export function PublicCard({ card, qrDataUrl }: PublicCardProps) {
  return (
    <article className="premium-card mx-auto max-w-sm p-6 text-center">
      <p className="section-eyebrow">Tarjeta VIP</p>
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
      <p className="mt-4 text-sm font-semibold text-cactus-forest">
        {card.rewardAvailable
          ? `Premio listo: ${card.rewardDescription}`
          : `Te faltan ${card.visitsUntilReward} visitas para ${card.rewardDescription}`}
      </p>
      {qrDataUrl ? (
        // El QR se genera en el momento como imagen local.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt="Código QR de tu tarjeta VIP"
          className="mx-auto mt-6 h-52 w-52 rounded-2xl bg-white p-2"
        />
      ) : (
        <p className="mt-6 break-all text-xs text-stone-500">{card.cardUrl}</p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-stone-600">
        Guarda esta página en tus favoritos para tener tu tarjeta a la mano.
      </p>
    </article>
  );
}
