import type { LoyaltySettingsView } from "@/lib/types";

type LoyaltyConfigOverviewProps = {
  settings: LoyaltySettingsView;
  demoExample?: boolean;
};

const ITEMS = [
  {
    emoji: "🎯",
    title: "Meta de visitas",
    describe: (s: LoyaltySettingsView) =>
      `Tras ${s.visitsPerReward} visitas válidas, el cliente puede canjear su premio en mostrador.`,
  },
  {
    emoji: "🎁",
    title: "Premio",
    describe: (s: LoyaltySettingsView) => s.rewardDescription,
  },
  {
    emoji: "⏱️",
    title: "Tiempo entre visitas",
    describe: (s: LoyaltySettingsView) =>
      `Mínimo ${s.minHoursBetweenVisits} horas entre una visita y la siguiente para evitar dobles registros.`,
  },
  {
    emoji: "💬",
    title: "Mensaje de cumpleaños",
    describe: (s: LoyaltySettingsView) => {
      const preview = s.birthdayMessage.replace(/\{\{1\}\}/g, "María").replace(/\n+/g, " ").trim();
      const clipped = preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;
      return `Texto para WhatsApp manual. Vista previa: «${clipped}»`;
    },
  },
] as const;

export function LoyaltyConfigOverview({ settings, demoExample }: LoyaltyConfigOverviewProps) {
  return (
    <section className="premium-card space-y-3 p-4">
      <div>
        <p className="section-eyebrow">Programa de lealtad</p>
        <h2 className="font-display text-lg font-bold text-cactus-charcoal">
          {demoExample ? "Ejemplo de lo que puedes gestionar" : "Resumen de tu programa"}
        </h2>
        {demoExample && (
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            Estos valores son de muestra. Al ejecutar el seed demo se guardan en la base; aquí puedes editarlos
            cuando tengas acceso de dueño.
          </p>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-cactus-sand/80 bg-gradient-to-br from-white to-cactus-cream/30 p-3 ring-1 ring-stone-100"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-cactus-charcoal">
              <span aria-hidden>{item.emoji}</span>
              {item.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{item.describe(settings)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
