/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B2131',
        'primary-dark': '#6b1021',
        'primary-darker': '#5a0d1c',
        'primary-darkest': '#4a0b19',
      },
    },
  },
  plugins: [
    forms,
  ],
}
