/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'
import colors from 'tailwindcss/colors'

/*
 * Colours resolve to CSS variables defined in src/index.css so light/dark
 * themes switch in one place. Legacy names (primary, surface-dark, …) are kept
 * as aliases so older markup follows the design tokens.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral greys: zinc reads cleaner than the bluish default slate.
        slate: colors.zinc,
        gray: colors.zinc,

        primary: 'var(--accent)',
        'primary-dark': 'var(--accent-text)',
        'background-light': 'var(--surface-canvas)',
        'background-dark': 'var(--surface-canvas)',
        'surface-dark': 'var(--surface-solid)',
        'accent-dark': 'var(--surface-muted)',

        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        surface: {
          canvas: 'var(--surface-canvas)',
          solid: 'var(--surface-solid)',
          glass: 'var(--surface-glass)',
          muted: 'var(--surface-muted)',
          hover: 'var(--surface-hover)',
          inverse: 'var(--surface-inverse)',
        },
        content: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
          inverse: 'var(--text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          text: 'var(--accent-text)',
          soft: 'var(--accent-soft)',
          foreground: 'var(--accent-foreground)',
        },
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        success: 'var(--success)',
      },
      fontFamily: {
        display: ['Geist', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'ui-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'heading-sm': ['0.9375rem', { lineHeight: '1.35rem' }],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        raised: 'var(--shadow-raised)',
        overlay: 'var(--shadow-overlay)',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        full: '9999px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 160ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [forms, containerQueries],
}
