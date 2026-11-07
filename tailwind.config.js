/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FCF9F3",
          primary: "#AD292F",
          heading: "#1C1C18",
          muted: "#59413F",
          border: "#E1BFBC",
          inputbg: "#FFFFFF",
          accent: "#423238",
        },
        app: "#F6F9FA",
        surface: "#fcf9f3",
      },
      fontFamily: {
        newsreader: ["Newsreader"],
        jakarta: ["Plus Jakarta Sans"],
      },
    },
  },
  plugins: [],
};
