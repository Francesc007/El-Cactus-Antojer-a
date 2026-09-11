import type { Metadata } from "next";
import { Bitter, Nunito_Sans } from "next/font/google";
import { InventoryProvider } from "@/context/InventoryContext";
import { ReservationProvider } from "@/context/ReservationContext";
import "./globals.css";

const displayFont = Bitter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800"],
});

const sansFont = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "El Cactus Antojería",
  description:
    "Antojería mexicana con sabor auténtico. Reserva tu mesa en línea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${sansFont.variable} font-sans`}
        suppressHydrationWarning
      >
        <ReservationProvider>
          <InventoryProvider>{children}</InventoryProvider>
        </ReservationProvider>
      </body>
    </html>
  );
}
