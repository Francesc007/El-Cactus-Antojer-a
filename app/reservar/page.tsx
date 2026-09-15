import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { ReservationForm } from "@/components/reservation/ReservationForm";
import { PageBanner } from "@/components/ui/PageBanner";
import { RESERVATION_BANNER } from "@/lib/gallery-images";

export default function ReservarPage() {
  return (
    <div className="mesh-warm min-h-screen">
      <Header />
      <PageBanner image={RESERVATION_BANNER} variant="showcase" />
      <main className="px-4 pt-8 pb-12 sm:pt-10">
        <ReservationForm />
      </main>
      <Footer />
    </div>
  );
}
