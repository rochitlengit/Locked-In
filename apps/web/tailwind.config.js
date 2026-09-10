/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Public Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Atrium: warm paper + ink-blue accent. Every stop is a CSS variable
        // (see globals.css) so the whole app repaints when html.dark toggles —
        // no per-component dark: variants needed.
        brand: {
          50: 'rgb(var(--c-brand-50) / <alpha-value>)',
          100: 'rgb(var(--c-brand-100) / <alpha-value>)',
          200: 'rgb(var(--c-brand-200) / <alpha-value>)',
          300: 'rgb(var(--c-brand-300) / <alpha-value>)',
          400: 'rgb(var(--c-brand-400) / <alpha-value>)',
          500: 'rgb(var(--c-brand-500) / <alpha-value>)',
          600: 'rgb(var(--c-brand-600) / <alpha-value>)',
          700: 'rgb(var(--c-brand-700) / <alpha-value>)',
        },
        paper: {
          50: 'rgb(var(--c-gray-50) / <alpha-value>)',
          100: 'rgb(var(--c-gray-100) / <alpha-value>)',
          200: 'rgb(var(--c-gray-200) / <alpha-value>)',
          300: 'rgb(var(--c-gray-300) / <alpha-value>)',
          400: 'rgb(var(--c-gray-400) / <alpha-value>)',
          500: 'rgb(var(--c-gray-500) / <alpha-value>)',
        },
        gray: {
          50: 'rgb(var(--c-gray-50) / <alpha-value>)',
          100: 'rgb(var(--c-gray-100) / <alpha-value>)',
          200: 'rgb(var(--c-gray-200) / <alpha-value>)',
          300: 'rgb(var(--c-gray-300) / <alpha-value>)',
          400: 'rgb(var(--c-gray-400) / <alpha-value>)',
          500: 'rgb(var(--c-gray-500) / <alpha-value>)',
          600: 'rgb(var(--c-gray-600) / <alpha-value>)',
          700: 'rgb(var(--c-gray-700) / <alpha-value>)',
          800: 'rgb(var(--c-gray-800) / <alpha-value>)',
          900: 'rgb(var(--c-gray-900) / <alpha-value>)',
        },
        emerald: { 50: 'rgb(var(--c-emerald-50) / <alpha-value>)', 400: 'rgb(var(--c-emerald-400) / <alpha-value>)', 500: 'rgb(var(--c-emerald-500) / <alpha-value>)', 600: 'rgb(var(--c-emerald-600) / <alpha-value>)', 700: 'rgb(var(--c-emerald-700) / <alpha-value>)' },
        amber: { 50: 'rgb(var(--c-amber-50) / <alpha-value>)', 400: 'rgb(var(--c-amber-400) / <alpha-value>)', 500: 'rgb(var(--c-amber-500) / <alpha-value>)', 600: 'rgb(var(--c-amber-600) / <alpha-value>)', 700: 'rgb(var(--c-amber-700) / <alpha-value>)' },
        red: { 50: 'rgb(var(--c-red-50) / <alpha-value>)', 400: 'rgb(var(--c-red-400) / <alpha-value>)', 500: 'rgb(var(--c-red-500) / <alpha-value>)', 600: 'rgb(var(--c-red-600) / <alpha-value>)', 700: 'rgb(var(--c-red-700) / <alpha-value>)' },
        blue: { 50: 'rgb(var(--c-blue-50) / <alpha-value>)', 400: 'rgb(var(--c-blue-400) / <alpha-value>)', 500: 'rgb(var(--c-blue-500) / <alpha-value>)', 600: 'rgb(var(--c-blue-600) / <alpha-value>)', 700: 'rgb(var(--c-blue-700) / <alpha-value>)' },
        violet: { 50: 'rgb(var(--c-violet-50) / <alpha-value>)', 400: 'rgb(var(--c-violet-400) / <alpha-value>)', 500: 'rgb(var(--c-violet-500) / <alpha-value>)', 600: 'rgb(var(--c-violet-600) / <alpha-value>)', 700: 'rgb(var(--c-violet-700) / <alpha-value>)' },
      },
      borderRadius: { lg: '0.7rem', xl: '0.9rem' },
      boxShadow: {
        card: '0 1px 2px rgba(30,32,36,.06), 0 3px 10px -6px rgba(30,32,36,.14)',
        pop: '0 24px 44px -14px rgba(30,32,36,.30)',
        glow: '0 0 0 1px rgba(43,73,199,.35), 0 10px 26px -10px rgba(43,73,199,.4)',
        drag: '0 30px 54px -16px rgba(30,32,36,.4)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pop: { '0%': { opacity: '0', transform: 'scale(.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateY(12px) scale(.98)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        grow: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        rise: 'rise .32s cubic-bezier(.34,1.4,.4,1) both',
        fade: 'fade .22s ease-out both',
        pop: 'pop .26s cubic-bezier(.34,1.56,.64,1) both',
        'slide-in': 'slideIn .38s cubic-bezier(.34,1.4,.4,1) both',
        grow: 'grow .6s cubic-bezier(.34,1.1,.4,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
