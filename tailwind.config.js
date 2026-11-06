/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#dde9e6",
          primary: "#173f3b",
          heading: "#153a37",
          muted: "#536e6b",
          border: "#e2e8f0",
          inputbg: "#f8fafb",
          accent: "#1e5852",
        },
        app: "#F6F9FA",
      },
    },
  },
  plugins: [],
};
