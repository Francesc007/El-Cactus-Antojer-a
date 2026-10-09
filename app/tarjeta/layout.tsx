import type { Metadata } from "next";

/** Icono y nombre cortos para “Agregar a pantalla de inicio” (sin PWA instalable). */
export const metadata: Metadata = {
  applicationName: "Tarjeta VIP",
  appleWebApp: {
    title: "Tarjeta VIP",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function TarjetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
