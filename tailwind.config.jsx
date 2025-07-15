/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",                 // include Vite root index.html
    "./src/**/*.{js,jsx,ts,tsx}"    // include all components
  ],
  darkMode: 'class',                // enable dark mode toggle by adding class to body or root
  theme: {
    extend: {},
  },
  plugins: [],
};
