import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { ReservationForm } from "@/components/reservation/ReservationForm";
import { PageBanner } from "@/components/ui/PageBanner";
import { RESERVATION_BANNER } from "@/lib/gallery-images";

export default function ReservarPage() {
  return (
    <div className="mesh-warm min-h-screen">
      <Header />
      <PageBanner
        image={RESERVATION_BANNER}
        title="Reservar mesa"
        subtitle="Elige tu fecha y horario. Solo mostramos disponibilidad real."
      />
      <main className="relative -mt-6 px-4 pb-12">
        <ReservationForm />
      </main>
      <Footer />
    </div>
  );
}
