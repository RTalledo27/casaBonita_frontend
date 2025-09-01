// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts,scss}'],   // ← aquí se escanean los .scss
  plugins: [require('@tailwindcss/forms')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#6366f1',
          600: '#5b5bd6',
          700: '#4f46e5'
        }
      }
    },
  },
}