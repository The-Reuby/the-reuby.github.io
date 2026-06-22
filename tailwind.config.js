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
      },
    },
  },
  plugins: [],
}

