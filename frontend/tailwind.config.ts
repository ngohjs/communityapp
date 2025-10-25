import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--terra-accent-clay)",
          foreground: "var(--terra-accent-clay-foreground)"
        },
        surface: {
          canvas: "var(--terra-surface-canvas)",
          raised: "var(--terra-surface-raised)",
          subtle: "var(--terra-surface-subtle)"
        },
        ink: {
          900: "var(--terra-ink-900)",
          700: "var(--terra-ink-700)",
          500: "var(--terra-ink-500)",
          300: "var(--terra-ink-300)"
        },
        accent: {
          verdant: "var(--terra-accent-verdant)",
          clay: "var(--terra-accent-clay)"
        }
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body: ["Roboto", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["'Source Serif Pro'", "serif"]
      },
      fontSize: {
        "display-xl": ["2.625rem", { lineHeight: "3.125rem", letterSpacing: "-0.01em" }],
        "display-lg": ["2.125rem", { lineHeight: "2.625rem", letterSpacing: "-0.008em" }],
        "display-md": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-0.004em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "data-xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.12em" }]
      },
      spacing: {
        2.5: "0.625rem", // 10px
        3.75: "0.9375rem", // 15px
        7.5: "1.875rem", // 30px
        15: "3.75rem" // 60px
      },
      borderRadius: {
        card: "20px",
        ledger: "16px"
      },
      boxShadow: {
        ledger: "0 22px 44px -30px rgba(30, 40, 50, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        focus: "0 0 0 3px rgba(106, 169, 127, 0.35)"
      },
      backgroundImage: {
        ledger: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)"
      },
      transitionTimingFunction: {
        terra: "cubic-bezier(0.25, 0.1, 0.25, 1)"
      },
      keyframes: {
        "slide-up-soft": {
          "0%": { opacity: "0", transform: "translate3d(0, 16px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" }
        }
      },
      animation: {
        "slide-up-soft": "slide-up-soft 200ms ease-out forwards"
      }
    }
  },
  plugins: []
};

export default config;
