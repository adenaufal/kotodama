/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.html",
    "./dist/**/*.js",
  ],
  safelist: [
    'glass-card',
    'btn-hover',
    'focus-ring',
    'animate-in',
    'gradient-topbar',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
