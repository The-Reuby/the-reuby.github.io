/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#a4292e',  // medium wine red
          600: '#8c2130',  // darker wine red
          700: '#771825',  // deep wine red
          800: '#641320',  // very deep wine
          900: '#4c0519',  // darkest wine
          950: '#350512',
        },
        // Magazine redesign palette. `primary` above stays as-is because the
        // Voices page and its player still use it.
        ruby: {
          50: '#fbf4f4',
          100: '#f6e4e5',
          200: '#ecc5c8',
          300: '#dc9aa0',
          400: '#c4636b',
          500: '#a4292e',
          600: '#8c2130',
          700: '#771825',
          800: '#641320',
          900: '#4c0519',
          950: '#350512',
        },
        // Light/dark values live in index.css, so these need no `dark:` twins
        desk: 'rgb(var(--desk) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      boxShadow: {
        // A sheet of paper lying on the desk, as in the reader
        page: '0 1px 2px rgb(0 0 0 / 0.06), 0 12px 28px -12px rgb(0 0 0 / 0.28)',
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-in',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'enter-right': 'enter-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'enter-left': 'enter-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'progress-grow': 'progress-grow 2.7s ease-out forwards',
        'indeterminate': 'indeterminate 1.1s ease-in-out infinite',
        'marquee': 'marquee 40s linear infinite',
        'nav-in': 'nav-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'fade-out': {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.96) translateY(10px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'enter-right': {
          '0%': { opacity: 0, transform: 'translateX(28px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        'enter-left': {
          '0%': { opacity: 0, transform: 'translateX(-28px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        'progress-grow': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'indeterminate': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(420%)' },
        },
        'nav-in': {
          '0%': { opacity: 0, transform: 'translateY(-100%)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        // Content is rendered twice side by side, so shifting by half loops seamlessly
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

