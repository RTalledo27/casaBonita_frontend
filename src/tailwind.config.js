// tailwind.config.js
module.exports = {
  
  content: ['./src/**/*.{html,ts,scss}'],   // ← aquí se escanean los .scss
  plugins: [require('@tailwindcss/forms')],
    theme: {
      extend: {},
    },
   
  }