import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "facebookexternalhit",
        allow: "/",
        disallow: ["/panel", "/login", "/api"],
      },
      {
        userAgent: "Facebot",
        allow: "/",
        disallow: ["/panel", "/login", "/api"],
      },
      {
        userAgent: "WhatsApp",
        allow: "/",
        disallow: ["/panel", "/login", "/api"],
      },
      {
        userAgent: "meta-externalagent",
        allow: "/",
        disallow: ["/panel", "/login", "/api"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/login", "/api", "/tarjeta/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
