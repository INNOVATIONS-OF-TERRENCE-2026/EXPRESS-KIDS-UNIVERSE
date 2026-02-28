import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
      },
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // EKU Brand colors
        eku: {
          bg: "hsl(var(--eku-bg))",
          "bg-lighter": "hsl(var(--eku-bg-lighter))",
          "aurora-1": "hsl(var(--eku-aurora-1))",
          "aurora-2": "hsl(var(--eku-aurora-2))",
          "aurora-3": "hsl(var(--eku-aurora-3))",
          gold: "hsl(var(--eku-gold))",
          sky: "hsl(var(--eku-sky))",
          ink: "hsl(var(--eku-ink))",
          glow: "hsl(var(--eku-glow))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "aurora-flow": {
          "0%, 100%": { 
            backgroundPosition: "0% 50%",
            opacity: "0.8"
          },
          "50%": { 
            backgroundPosition: "100% 50%",
            opacity: "1"
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsl(var(--primary) / 0.6)",
            transform: "scale(1.02)"
          },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "spotlight": {
          "0%": { 
            opacity: "0",
            transform: "translateX(-100%) rotate(45deg)"
          },
          "50%": { opacity: "0.3" },
          "100%": { 
            opacity: "0",
            transform: "translateX(100%) rotate(45deg)"
          },
        },
        "twinkle": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        "portal-open": {
          "0%": { 
            transform: "scale(0) rotate(-180deg)",
            opacity: "0"
          },
          "100%": { 
            transform: "scale(1) rotate(0deg)",
            opacity: "1"
          },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "depth-breathe": {
          "0%, 100%": { transform: "translateZ(0px) scale(1)" },
          "50%": { transform: "translateZ(20px) scale(1.02)" },
        },
        "glow-pulse": {
          "0%, 100%": { 
            filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.3))",
          },
          "50%": { 
            filter: "drop-shadow(0 0 25px hsl(var(--primary) / 0.6)) drop-shadow(0 0 50px hsl(var(--primary) / 0.2))",
          },
        },
        "cinema-reveal": {
          "0%": { 
            opacity: "0",
            transform: "scale(0.8) rotateX(10deg) translateY(40px)",
            filter: "blur(10px)",
          },
          "100%": { 
            opacity: "1",
            transform: "scale(1) rotateX(0deg) translateY(0)",
            filter: "blur(0px)",
          },
        },
        "tilt-hover": {
          "0%, 100%": { transform: "rotateY(0deg) rotateX(0deg)" },
          "25%": { transform: "rotateY(3deg) rotateX(-2deg)" },
          "50%": { transform: "rotateY(-3deg) rotateX(2deg)" },
          "75%": { transform: "rotateY(2deg) rotateX(-1deg)" },
        },
        "nebula-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.5" },
          "33%": { transform: "translate(30px, -20px) scale(1.1)", opacity: "0.7" },
          "66%": { transform: "translate(-20px, 10px) scale(0.95)", opacity: "0.4" },
        },
        "particle-rise": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0" },
          "20%": { opacity: "0.8" },
          "100%": { transform: "translateY(-200px) scale(0)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "aurora-flow": "aurora-flow 8s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "spotlight": "spotlight 4s ease-in-out infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "portal-open": "portal-open 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "float-slow": "float 8s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "spin-slow": "spin 20s linear infinite",
        "spin-reverse": "spin-reverse 15s linear infinite",
        "depth-breathe": "depth-breathe 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "cinema-reveal": "cinema-reveal 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        "tilt-hover": "tilt-hover 6s ease-in-out infinite",
        "nebula-drift": "nebula-drift 25s ease-in-out infinite",
        "particle-rise": "particle-rise 8s ease-out infinite",
      },
      backgroundImage: {
        "aurora-gradient": "linear-gradient(135deg, hsl(var(--eku-aurora-1)), hsl(var(--eku-aurora-2)), hsl(var(--eku-aurora-3)))",
        "glass-gradient": "linear-gradient(135deg, hsl(var(--glass-bg) / 0.8), hsl(var(--glass-bg) / 0.4))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;