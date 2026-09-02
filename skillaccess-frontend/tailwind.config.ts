/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "spin-fast": "spin 500ms linear infinite",
      },
      fontFamily: {
        jost: ["var(--font-jost)", "sans-serif"],
      },
    },
  },
};
