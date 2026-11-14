import { BUSINESS_INFO, CLOSED_DAYS_LABEL } from "@/lib/business-info";

export function HoursSection() {
  return (
    <section className="relative scroll-mt-24 bg-white px-4 pb-16 pt-28 md:scroll-mt-28 md:px-8 md:pb-24 md:pt-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cactus-sand to-transparent" />
      <div className="mx-auto grid max-w-6xl items-start gap-8 md:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.4fr)] md:gap-16">
        <div>
          <p className="section-eyebrow">Visítanos</p>
          <h2 className="section-title mt-2 md:text-5xl">Horarios</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-600 md:text-base">
            Te esperamos con el mejor ambiente y los antojitos más ricos.
          </p>
        </div>

        <div className="space-y-3">
          {BUSINESS_INFO.hours.map((schedule) => (
            <div
              key={schedule.label}
              className="premium-card flex items-center justify-between gap-4 border-l-4 border-l-cactus-lime px-5 py-4 md:px-6 md:py-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-cactus-lime" />
                <span className="font-semibold text-cactus-charcoal">
                  {schedule.label}
                </span>
              </div>
              <span className="shrink-0 text-right font-medium text-cactus-forest">
                {schedule.display}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-5 py-4 md:px-6 md:py-5">
            <span className="font-semibold text-stone-500">
              {CLOSED_DAYS_LABEL}
            </span>
            <span className="text-sm font-medium text-stone-400">Cerrado</span>
          </div>
        </div>
      </div>
    </section>
  );
}
