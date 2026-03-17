/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b2bee',
        'background-light': '#f6f6f8',
        'background-dark': '#121022',
        'surface-dark': '#1c1a33',
        'accent-dark': '#262348',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [forms, containerQueries],
}

