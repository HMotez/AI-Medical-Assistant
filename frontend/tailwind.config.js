/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Design tokens live in src/index.css (:root); these map them to utilities
      colors: {
        page:    token("page"),
        frame:   token("frame"),
        panel:   token("panel"),
        panel2:  token("panel-2"),
        raise:   token("raise"),
        ink:     token("ink"),
        muted:   token("muted"),
        dim:     token("dim"),
        accent:  token("accent"),
        accent2: token("accent-2"),
        pill:    token("pill"),
        good:    token("good"),
        warn:    token("warn"),
        serious: token("serious"),
        bad:     token("bad"),
        line:    "var(--line)",
      },
      fontFamily: {
        sans:    ["Onest", "system-ui", "Segoe UI", "sans-serif"],
        display: ["Bricolage Grotesque", "Onest", "system-ui", "sans-serif"],
        mono:    ["Martian Mono", "ui-monospace", "Consolas", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        card: "26px",
        frame: "34px",
      },
      boxShadow: {
        elev1: "var(--elev-1)",
        elev2: "var(--elev-2)",
        glow:  "0 10px 26px -10px var(--glow)",
        frame: "var(--shadow-frame)",
      },
      backgroundImage: {
        hero: "var(--hero)",
      },
    },
  },
  plugins: [],
};
