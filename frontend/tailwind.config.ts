import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neutral: {
          0: "var(--color-neutral-0)",
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          1000: "var(--color-neutral-1000)"
        },
        clay: {
          100: "var(--color-clay-100)",
          300: "var(--color-clay-300)",
          500: "var(--color-clay-500)",
          600: "var(--color-clay-600)",
          700: "var(--color-clay-700)"
        },
        verdant: {
          100: "var(--color-verdant-100)",
          300: "var(--color-verdant-300)",
          500: "var(--color-verdant-500)",
          600: "var(--color-verdant-600)",
          700: "var(--color-verdant-700)"
        },
        terra: {
          background: {
            page: "var(--terra-background-page)",
            surface: "var(--terra-background-surface)",
            subtle: "var(--terra-background-subtle)",
            highlight: "var(--terra-background-highlight)",
            overlay: "var(--terra-background-overlay)"
          },
          text: {
            strong: "var(--terra-text-strong)",
            body: "var(--terra-text-body)",
            muted: "var(--terra-text-muted)",
            subtle: "var(--terra-text-subtle)",
            inverse: "var(--terra-text-inverse)",
            positive: "var(--terra-text-positive)",
            danger: "var(--terra-text-danger)"
          },
          border: {
            strong: "var(--terra-border-strong)",
            soft: "var(--terra-border-soft)",
            focus: "var(--terra-border-focus)",
            danger: "var(--terra-border-danger)"
          },
          action: {
            primary: "var(--terra-action-primary-bg)",
            "primary-hover": "var(--terra-action-primary-bg-hover)",
            "primary-foreground": "var(--terra-action-primary-text)",
            secondary: "var(--terra-action-secondary-bg)",
            "secondary-hover": "var(--terra-action-secondary-bg-hover)",
            "secondary-foreground": "var(--terra-action-secondary-text)"
          },
          status: {
            success: "var(--terra-status-success-bg)",
            warning: "var(--terra-status-warning-bg)",
            danger: "var(--terra-status-danger-bg)",
            info: "var(--terra-status-info-bg)"
          },
          shadow: {
            level1: "var(--shadow-level-1)",
            level2: "var(--shadow-level-2)",
            ledger: "var(--shadow-ledger)"
          }
        },
        brand: {
          DEFAULT: "var(--terra-action-primary-bg)",
          foreground: "var(--terra-action-primary-text)"
        },
        accent: {
          verdant: "var(--color-verdant-500)",
          clay: "var(--color-clay-500)",
          amber: "var(--color-amber-500)",
          crimson: "var(--color-crimson-500)",
          sky: "var(--color-sky-500)"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "Roboto", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body: ["var(--font-body)", "Roboto", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        data: ["var(--font-data)", "Work Sans", "var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "'Source Serif Pro'", "serif"]
      },
      fontSize: {
        "display-xl": ["2.625rem", { lineHeight: "3.125rem", letterSpacing: "-0.01em" }],
        "display-lg": ["2.125rem", { lineHeight: "2.625rem", letterSpacing: "-0.008em" }],
        "display-md": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-0.004em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "body-xs": ["0.75rem", { lineHeight: "1.125rem" }],
        "data-xs": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.12em" }]
      },
      spacing: {
        "1.5": "var(--space-1-5)",
        2.5: "var(--space-2-5)",
        3.5: "var(--space-3-5)",
        7.5: "var(--space-7-5)",
        15: "var(--space-15)"
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        pill: "var(--radius-pill)",
        card: "var(--terra-card-radius)",
        ledger: "var(--terra-ledger-radius)"
      },
      boxShadow: {
        level1: "var(--shadow-level-1)",
        level2: "var(--shadow-level-2)",
        ledger: "var(--shadow-ledger)",
        focus: "var(--terra-focus-shadow)"
      },
      backgroundImage: {
        ledger: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)"
      },
      transitionTimingFunction: {
        terra: "var(--motion-ease-standard)",
        "terra-decelerate": "var(--motion-ease-decelerate)",
        "terra-accelerate": "var(--motion-ease-accelerate)"
      },
      transitionDuration: {
        snappy: "var(--motion-duration-snappy)",
        productive: "var(--motion-duration-productive)",
        expressive: "var(--motion-duration-expressive)"
      },
      keyframes: {
        "slide-up-soft": {
          "0%": { opacity: "0", transform: "translate3d(0, 16px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" }
        },
        "fade-in-soft": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "scale-pop": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        "slide-up-soft": "slide-up-soft var(--motion-duration-productive) var(--motion-ease-decelerate) forwards",
        "fade-in-soft": "fade-in-soft var(--motion-duration-productive) var(--motion-ease-standard) forwards",
        "scale-pop": "scale-pop var(--motion-duration-productive) var(--motion-ease-decelerate) forwards"
      }
    }
  },
  plugins: []
};

export default config;
