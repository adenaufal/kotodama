/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

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
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('light', '.light-mode &')
    })
  ],
}
