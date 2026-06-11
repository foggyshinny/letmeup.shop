import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#13C4D3",
          dark: "#0EA5B5",
          light: "#E6FAFC",
        },
        accent: {
          DEFAULT: "#FF6B6B",
          dark: "#E84C4C",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -8px rgba(15,23,42,0.12)",
        float: "0 12px 32px -8px rgba(15,23,42,0.22)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
