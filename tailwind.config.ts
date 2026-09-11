import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cactus: {
          lime: "#A3D14D",
          forest: "#4BA747",
          "forest-dark": "#1A3D18",
          sun: "#FED500",
          sunset: "#F7941D",
          cream: "#FDF8F0",
          sand: "#E8DFD0",
          charcoal: "#1A2318",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 8px 32px -8px rgba(26, 35, 24, 0.12), 0 2px 8px -2px rgba(26, 35, 24, 0.06)",
        "glow-orange": "0 8px 28px -4px rgba(247, 148, 29, 0.45)",
        "glow-green": "0 8px 28px -4px rgba(75, 167, 71, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
