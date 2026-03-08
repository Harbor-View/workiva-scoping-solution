/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hv: {
          navy: "#1B2B4B",
          gold: "#C9A84C",
          slate: "#4A5568",
        },
      },
    },
  },
  plugins: [],
};
