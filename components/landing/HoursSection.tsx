import { BUSINESS_INFO, CLOSED_DAYS_LABEL } from "@/lib/business-info";

export function HoursSection() {
  return (
    <section className="relative bg-white px-4 py-14">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cactus-sand to-transparent" />
      <div className="mx-auto max-w-lg">
        <p className="section-eyebrow">Visítanos</p>
        <h2 className="section-title mt-2">Horarios</h2>
        <p className="mt-2 text-sm text-stone-600">
          Te esperamos con el mejor ambiente y los antojitos más ricos.
        </p>

        <div className="mt-6 space-y-3">
          {BUSINESS_INFO.hours.map((schedule) => (
            <div
              key={schedule.label}
              className="premium-card flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-cactus-lime" />
                <span className="font-semibold text-cactus-charcoal">
                  {schedule.label}
                </span>
              </div>
              <span className="font-medium text-cactus-forest">
                {schedule.display}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-5 py-4">
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
