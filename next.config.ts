import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // El middleware del panel existe; sin este tope Next puede cortar POST con foto
  // (reseñas y alta de tarjeta) y el celular muestra "Failed to fetch".
  experimental: {
    middlewareClientMaxBodySize: "10mb",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
