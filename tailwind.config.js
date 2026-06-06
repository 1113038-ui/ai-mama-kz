/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        }
      },
      boxShadow: {
        'premium': '0 20px 60px -10px rgba(124, 58, 237, 0.25)',
        'card': '0 4px 24px -4px rgba(124, 58, 237, 0.10)',
        'glow': '0 0 40px rgba(168, 85, 247, 0.35)',
        'btn': '0 8px 24px -4px rgba(124, 58, 237, 0.45)',
      }
    },
  },
  plugins: [],
}
