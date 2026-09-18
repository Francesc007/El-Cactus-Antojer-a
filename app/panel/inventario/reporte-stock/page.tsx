import type { Metadata } from "next";
import { StockReportPreview } from "@/components/panel/inventory/StockReportPreview";
import { requireStaff } from "@/lib/auth";
import { BUSINESS_INFO } from "@/lib/business-info";
import { buildStockReport } from "@/lib/inventory-stock-report";
import { listProducts } from "@/lib/services/inventory";

export const metadata: Metadata = {
  title: "Reporte de stock",
};

export default async function StockReportPreviewPage() {
  await requireStaff();
  const products = await listProducts();
  const report = buildStockReport(products, BUSINESS_INFO.name);

  return (
    <>
      <style>{`
        @media print {
          aside,
          .report-screen-only {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .report-print-root {
            max-width: none;
            padding: 0;
          }
        }
      `}</style>
      <StockReportPreview data={report} downloadHref="/api/inventory/stock-report" />
    </>
  );
}
