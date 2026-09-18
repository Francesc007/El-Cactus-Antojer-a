import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { StockReportPdfDocument } from "@/components/panel/inventory/StockReportPdfDocument";
import { requireStaff } from "@/lib/auth";
import { BUSINESS_INFO } from "@/lib/business-info";
import { getPublicEnv } from "@/lib/env";
import { buildStockReport, stockReportFilename } from "@/lib/inventory-stock-report";
import { listProducts } from "@/lib/services/inventory";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireStaff();
    const products = await listProducts();
    const generatedAt = new Date();
    const report = buildStockReport(products, BUSINESS_INFO.name, generatedAt);
    const logoUrl = `${getPublicEnv().appUrl}/logo.png`;

    const buffer = await renderToBuffer(
      React.createElement(StockReportPdfDocument, { data: report, logoUrl })
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${stockReportFilename(generatedAt)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte";
    const status = message.includes("iniciar sesión") ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
