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
        // ── Paper: the storybook page the whole site sits on ──
        parchment: "#FFF9EE",
        cream: {
          50: "#FFF9EE",
          100: "#FFF3DE",
          200: "#FBE8CC",
          300: "#F3D9B4",
          400: "#E4C08C",
        },
        // ── Golden hour ──
        gold: {
          100: "#FDF0CE",
          200: "#FADFA0",
          300: "#F6C85F",
          400: "#E5B043",
          DEFAULT: "#F6C85F",
        },
        sage: {
          50: "#F0F5EE",
          100: "#DCE9D6",
          200: "#A8C89C",
          300: "#8FB283",
          400: "#6F9463",
          500: "#527A49",
        },
        // ── Brand orange — the one accent colour of the interface.
        //    Defined once as CSS variables in globals.css; never hardcode a hex.
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          DEFAULT: "rgb(var(--brand-500) / <alpha-value>)",
        },
        // ── Ink ──
        brown: {
          50: "#F7F1E9",
          100: "#EADCCB",
          200: "#D2B99A",
          300: "#A98A66",
          400: "#7C5F45",
          500: "#5C4432",
          600: "#402D21",
          DEFAULT: "#5C4432",
          dark: "#402D21",
        },
        accent: {
          DEFAULT: "rgb(var(--brand-500) / <alpha-value>)",
          hover: "rgb(var(--brand-600) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 20px rgba(64,45,33,0.06)",
        card: "0 8px 30px rgba(64,45,33,0.09)",
        elevated: "0 18px 50px rgba(64,45,33,0.14)",
        glow: "0 20px 60px rgb(var(--brand-500) / 0.24)",
      },
      backgroundImage: {
        "paper-grain":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.9)" },
          "50%": { opacity: "0.85", transform: "scale(1.1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up": "slideUp 0.8s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 7s ease-in-out infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
