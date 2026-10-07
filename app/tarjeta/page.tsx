import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { LoyaltySignupForm } from "@/components/loyalty/LoyaltySignupForm";

export const metadata: Metadata = {
  title: "Genera tu tarjeta VIP",
};

export default function TarjetaSignupPage() {
  return (
    <div className="mesh-warm min-h-screen">
      <Header />
      <main className="px-4 py-8">
        <LoyaltySignupForm />
      </main>
      <Footer />
    </div>
  );
}
