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
        'accent': '#ffcc00',
        'accent-dark': '#e6b800',
        'accent-darker': '#cc9900',
        'accent-darkest': '#b38600',
        'success': '#4CAF50',
        'success-dark': '#43A047',
        'success-darker': '#388E3C',
        'success-darkest': '#2E7D32',
        'error': '#dc004e',
        'error-dark': '#c51162',
        'error-darker': '#b00020',
        'error-darkest': '#9a0036',
        'background': '#1a1a1a',
        'background-light': '#f5f5f5',
        'background-lighter': '#ffffff',
      },
    },
  },
  plugins: [
    forms,
  ],
}
