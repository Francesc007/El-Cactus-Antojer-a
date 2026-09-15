import type { Metadata } from "next";
import { BUSINESS_INFO } from "@/lib/business-info";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
};

export default async function PrivacidadPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="mesh-warm min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <BackButton from={from} className="mb-6" />
        <p className="section-eyebrow">Legal</p>
        <h1 className="section-title mt-2">Aviso de privacidad</h1>
        <div className="premium-card mt-6 space-y-4 p-6 text-sm leading-relaxed text-stone-700">
          <p>
            {BUSINESS_INFO.name} recaba nombre y teléfono únicamente para
            gestionar reservas, confirmar asistencia y contactarte sobre tu mesa.
          </p>
          <p>
            Los datos se almacenan de forma segura, con acceso restringido al
            personal autorizado. No se venden ni se usan para publicidad de
            terceros.
          </p>
          <p>
            Conservamos la información el tiempo necesario para la operación del
            restaurante y obligaciones legales. Puedes solicitar acceso,
            corrección o cancelación escribiendo al negocio.
          </p>
          <p>
            Al enviar una reserva, otorgas tu consentimiento para este
            tratamiento conforme a la LFPDPPP.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
