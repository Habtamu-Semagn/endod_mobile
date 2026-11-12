/** @type {import('tailwindcss').Config} */

// The palette is read from `src/lib/theme.json` — the same file the app
// imports in `src/lib/theme.ts`. There is only one set of colours, so a class
// name and an inline style can never resolve to different values.
const palette = require("./src/lib/theme.json");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: palette.bg,
          surface: palette.surface,
          alt: palette.surfaceAlt,
          primary: palette.primary,
          heading: palette.heading,
          body: palette.body,
          muted: palette.muted,
          accent: palette.accent,
          "accent-deep": palette.accentDeep,
          danger: palette.danger,
          "danger-soft": palette.dangerSoft,
          success: palette.success,
          "success-soft": palette.successSoft,
          border: palette.border,
          "on-dark": palette.onDark,
          "on-dark-accent": palette.onDarkAccent,
          overlay: palette.overlay,
          inputbg: palette.surface,
        },
      },
      fontFamily: {
        newsreader: ["Newsreader"],
        jakarta: ["Plus Jakarta Sans"],
      },
    },
  },
  plugins: [],
};
