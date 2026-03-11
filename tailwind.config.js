/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hv: {
          navy: "#002A4E",
          blue: "#079FE0",
          slate: "#686B70",
          yellow: "#FFC857",
          mint: "#3AB795",
          coral: "#FF6F61",
          white: "#F8F9FA",
          border: "#D1D3D4",
        },
      },
      fontFamily: {
        sans: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
