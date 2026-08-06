/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',
        'primary-dark': '#2dd4bf',
        'background-light': '#f8fafc',
        'background-dark': '#0f172a',
        'surface-dark': '#1e293b',
        'accent-dark': '#334155',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        sm: '0.1875rem',
        DEFAULT: '0.25rem',
        md: '0.3125rem',
        lg: '0.375rem',
        xl: '0.5rem',
        '2xl': '0.625rem',
        '3xl': '0.875rem',
        full: '9999px',
      },
    },
  },
  plugins: [forms, containerQueries],
}

