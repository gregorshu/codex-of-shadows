import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#16181d",
        "surface-strong": "#1d2026",
        outline: "#2c3038",
        accent: "#7dd3fc",
      },
      borderRadius: {
        soft: "14px",
      },
      boxShadow: {
        card: "0 6px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
