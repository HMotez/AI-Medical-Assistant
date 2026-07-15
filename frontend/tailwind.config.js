/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        medical: {
          bg:   "#f0f9ff",
          card: "#ffffff",
          hero: "#e0f7fa",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
      },
      boxShadow: {
        card:       "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1), 0 16px 48px rgba(0,0,0,0.12)",
        hero:       "0 12px 48px rgba(20,184,166,0.25)",
        teal:       "0 8px 24px rgba(20,184,166,0.4)",
        glow:       "0 0 0 4px rgba(20,184,166,0.15)",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideIn:   { from: { opacity: "0", transform: "translateX(-16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        scaleIn:   { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "fade-in":  "fadeIn 0.35s ease-out both",
        "slide-in": "slideIn 0.3s ease-out both",
        "scale-in": "scaleIn 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
