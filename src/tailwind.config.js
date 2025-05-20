// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{html,ts,scss}'],   // ← asegúrate que incluye .scss
  plugins: [require('@tailwindcss/forms')],
    theme: {
      extend: {},
    },
   
  }