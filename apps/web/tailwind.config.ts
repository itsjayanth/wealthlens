import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#dbeafe",
        },
      },
    },
  },
  plugins: [],
};

export default config;
