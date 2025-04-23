/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "scout-purple": "#460087",
        "scout-blue": "#6EC1E4",
        "scout-light": "#f0f5ff",
        "scout-dark": "#2c0052",
        "scout-accent": "#00c4cc",
      },
      minWidth: {
        8: "2rem",
      },
      fontFamily: {
        sans: [
          "Roboto",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [import("@tailwindcss/forms")],
};
