import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        "bg-canvas": "#FBF6EF",
        "bg-surface": "#F1E4D3",
        "bg-surface-alt": "#EAD9C3",
        "border-subtle": "#E3D5C2",
        "text-primary": "#3B2A20",
        "text-secondary": "#5A4433",
        "text-inverse": "#FBF6EF",
        "accent-terracotta": "#C1613D",
        "accent-terracotta-hover": "#A34E30",
        "accent-clay": "#D98259",
        "secondary-olive": "#6B7A4F",
        "secondary-olive-hover": "#55613E",
        success: "#4B6B3F",
        warning: "#A9752E",
        error: "#8C3B2E",
        "focus-ring": "#3B2A20",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        pill: "999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(59,42,32,0.06)",
        md: "0 4px 12px rgba(59,42,32,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
