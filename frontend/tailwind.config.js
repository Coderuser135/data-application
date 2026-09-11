/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#641e1e',
          950: '#450a0a',
        },
        ink: {
          950: '#0a0a0b',
          900: '#121214',
          800: '#1c1c1f',
          700: '#2a2a2e',
          600: '#3a3a40',
        },
        surface: {
          50: '#f5f5f6',
          100: '#e8e8ea',
          200: '#d4d4d8',
          300: '#a1a1aa',
          400: '#71717a',
          500: '#52525b',
          600: '#3f3f46',
          700: '#2d2d33',
          800: '#1f1f23',
          900: '#161618',
          950: '#0c0c0e',
        },
      },
      fontFamily: { display: ['Sora', 'sans-serif'], sans: ['DM Sans', 'sans-serif'] },
      backgroundImage: { 'hero-grid': 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)' },
    },
  },
  plugins: [],
};
