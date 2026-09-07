import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#050608",
          950: "#050608",
          900: "#0a0c10",
          800: "#12151b",
          700: "#1b1f28",
          600: "#262b37",
          500: "#3a4152",
        },
        gold: {
          DEFAULT: "#c9a96a",
          light: "#e6d7ae",
          dark: "#a6813f",
          muted: "#8a744f",
        },
        parchment: {
          DEFAULT: "#f3efe6",
          muted: "#c9c3b6",
          dim: "#8f897c",
        },
        // Legacy alias so any un-migrated `accent-*` classes still resolve.
        accent: {
          DEFAULT: "#c9a96a",
          dark: "#a6813f",
          light: "#e6d7ae",
        },
        emerald: {
          soft: "#34d399",
        },
        rose: {
          soft: "#fb7185",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(201, 169, 106, 0.45)",
        "glow-sm": "0 0 24px -8px rgba(201, 169, 106, 0.4)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(60% 60% at 50% 0%, rgba(201,169,106,0.16) 0%, rgba(5,6,8,0) 70%)",
        "gold-gradient": "linear-gradient(135deg, #e6d7ae 0%, #c9a96a 45%, #a6813f 100%)",
        noise:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 2.5s linear infinite",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
