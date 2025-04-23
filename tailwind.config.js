/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'scout-blue': '#003982',
        'scout-purple': '#490075',
        'scout-green': '#00965E',
      },
    },
  },
  plugins: [],
}