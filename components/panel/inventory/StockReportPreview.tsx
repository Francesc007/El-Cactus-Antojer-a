"use client";

import Image from "next/image";
import Link from "next/link";
import type { StockReportData } from "@/lib/inventory-stock-report";
import type { StockStatus } from "@/lib/inventory";

const SECTION_UI: Record<
  StockStatus,
  { header: string; title: string; subtitle: string; count: string }
> = {
  low: {
    header: "bg-red-50 border-red-200",
    title: "text-red-700",
    subtitle: "text-red-600/80",
    count: "text-red-700",
  },
  warning: {
    header: "bg-amber-50 border-amber-200",
    title: "text-amber-800",
    subtitle: "text-amber-700/80",
    count: "text-amber-700",
  },
  ok: {
    header: "bg-green-50 border-green-200",
    title: "text-green-800",
    subtitle: "text-green-700/80",
    count: "text-green-700",
  },
};

type StockReportPreviewProps = {
  data: StockReportData;
  downloadHref: string;
};

export function StockReportPreview({ data, downloadHref }: StockReportPreviewProps) {
  return (
    <div className="report-print-root mx-auto max-w-3xl bg-white px-6 py-8 sm:px-10 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b-2 border-cactus-forest pb-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 ring-2 ring-cactus-lime/50">
            <Image src="/logo.png" alt="El Cactus" width={56} height={56} className="scale-110 object-contain" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-cactus-forest-dark">
              {data.businessName}
            </h1>
            <p className="text-sm font-semibold text-cactus-forest">Reporte de stock actual</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Generado</p>
          <p className="mt-1 text-sm font-bold text-cactus-charcoal">{data.generatedAtLabel}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Productos", value: data.totals.products, className: "text-cactus-charcoal" },
          { label: "Stock bajo", value: data.totals.low, className: "text-red-600" },
          { label: "En atención", value: data.totals.warning, className: "text-amber-600" },
          { label: "OK", value: data.totals.ok, className: "text-green-700" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-cactus-sand bg-cactus-cream/60 px-4 py-3"
          >
            <p className={`font-display text-2xl font-bold ${card.className}`}>{card.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {data.sections.map((section) => {
          const ui = SECTION_UI[section.status];
          return (
            <section key={section.status}>
              <div
                className={`mb-2 flex items-center justify-between rounded-lg border px-4 py-3 ${ui.header}`}
              >
                <div>
                  <h2 className={`font-display text-lg font-bold ${ui.title}`}>{section.title}</h2>
                  <p className={`text-sm ${ui.subtitle}`}>{section.subtitle}</p>
                </div>
                <span className={`font-display text-xl font-bold ${ui.count}`}>
                  {section.items.length}
                </span>
              </div>

              {section.items.length === 0 ? (
                <p className="px-2 py-3 text-sm italic text-stone-500">
                  Sin productos en esta categoría.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100 rounded-xl border border-stone-100">
                  {section.items.map((item) => (
                    <li
                      key={`${section.status}-${item.name}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-cactus-charcoal">{item.name}</span>
                      <span className="font-mono text-stone-700">
                        <strong>{item.stock}</strong> {item.unit}
                        <span className="ml-3 text-stone-400">
                          mín. {item.minStock} {item.unit}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="report-screen-only mt-8 flex flex-wrap gap-3 border-t border-cactus-sand pt-6">
        <Link
          href={downloadHref}
          className="btn-secondary px-5 py-2.5 text-sm"
        >
          Descargar PDF
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border-2 border-cactus-forest/35 bg-white px-5 py-2.5 text-sm font-semibold text-cactus-forest"
        >
          Imprimir
        </button>
      </div>

      <p className="mt-8 border-t border-cactus-sand pt-4 text-xs text-stone-500">
        El Cactus Antojería — Inventario · Uso interno para compras y reposición
      </p>
    </div>
  );
}
