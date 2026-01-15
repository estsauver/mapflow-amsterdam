import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Du Bois Palette - Primary Colors
        dubois: {
          carmine: "#C41E3A",
          gold: "#DAA520",
          prussian: "#1E3A5F",
          emerald: "#2E8B57",
          // Neutrals
          ink: "#1A1A1A",
          charcoal: "#4A4A4A",
          parchment: "#E8DCC8",
          cream: "#F5F0E6",
          "warm-white": "#FAF8F5",
          // Extended
          sepia: "#8B4513",
          steel: "#4682B4",
          tan: "#D2B48C",
          burgundy: "#800020",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        // Blog typography
        fraunces: ["Fraunces", "serif"],
        mono: ["JetBrains Mono", "monospace"],
        // Du Bois inspired typography
        condensed: ["Oswald", "DIN Condensed", "Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;