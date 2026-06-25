import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background:         "hsl(var(--background))",
        foreground:         "hsl(var(--foreground))",
        card:               "hsl(var(--card))",
        "card-foreground":  "hsl(var(--card-foreground))",
        border:             "hsl(var(--border))",
        muted:              "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        input:              "hsl(var(--input))",
        ring:               "hsl(var(--ring))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        success: "#0F8A5F",
        warning: "#A16207"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 60px rgba(11, 18, 32, 0.08)"
      }
    }
  },
  plugins: [animate]
};

export default config;
