import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { PublicCard } from "@/components/loyalty/PublicCard";
import { getPublicLoyaltyCard } from "@/lib/services/loyalty";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Tarjeta VIP" },
  robots: { index: false, follow: false },
};

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
