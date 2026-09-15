import type { Metadata } from "next";
import { Bitter, Nunito_Sans } from "next/font/google";
import { BUSINESS_INFO } from "@/lib/business-info";
import { JsonLd } from "@/components/seo/JsonLd";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "El Cactus Antojería",
    template: "%s | El Cactus Antojería",
  },
  description:
    "Antojería mexicana con sabor auténtico. Reserva tu mesa en línea.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "El Cactus Antojería",
    description: "Reserva tu mesa en El Cactus Antojería, Tepeji del Río.",
    url: appUrl,
    locale: "es_MX",
    type: "website",
    images: ["/cactus%204.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "El Cactus Antojería",
    description: "Reserva tu mesa en El Cactus Antojería.",
  },
  robots: { index: true, follow: true },
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
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: BUSINESS_INFO.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: BUSINESS_INFO.address.line1,
              addressLocality: "Tepeji del Río de Ocampo",
              addressRegion: "Hidalgo",
              postalCode: BUSINESS_INFO.address.zip,
              addressCountry: "MX",
            },
            url: appUrl,
            servesCuisine: "Mexicana",
            telephone: "+52-773-149-1349",
          }}
        />
        {children}
      </body>
    </html>
  );
}
