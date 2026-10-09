import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { PublicCard } from "@/components/loyalty/PublicCard";
import { getPublicLoyaltyCard } from "@/lib/services/loyalty";

export const dynamic = "force-dynamic";

type CardPageProps = {
  params: Promise<{ memberCode: string }>;
  searchParams: Promise<{ v?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: CardPageProps): Promise<Metadata> {
  const { memberCode } = await params;
  const query = await searchParams;
  const raw = Array.isArray(query.v) ? query.v[0] : query.v;
  const token = raw && /^[a-z0-9]{4,16}$/i.test(raw) ? raw : "";
  const slug = encodeURIComponent(decodeURIComponent(memberCode));
  return {
    title: { absolute: "Tarjeta VIP" },
    robots: { index: false, follow: false },
    openGraph: {
      title: "El Cactus Antojería",
      description: "Reserva tu mesa en El Cactus Antojería, Tepeji del Río.",
      url: `/tarjeta/${slug}${token ? `?v=${token}` : ""}`,
      images: ["/cactus%204.jpeg"],
    },
  };
}

export default async function LoyaltyCardPage({
  params,
}: {
  params: Promise<{ memberCode: string }>;
}) {
  const { memberCode } = await params;
  const card = await getPublicLoyaltyCard(decodeURIComponent(memberCode));
  if (!card) {
    notFound();
  }

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(card.cardUrl, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: "M",
    });
  } catch {
    qrDataUrl = null;
  }

  return (
    <div className="mesh-warm min-h-screen">
      <Header />
      <main className="px-4 py-8">
        <PublicCard card={card} qrDataUrl={qrDataUrl} />
      </main>
      <Footer />
    </div>
  );
}
