/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./scripts/**/*.js"],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617',
        },
        primary: {
          400: '#fbbf24', // Amber/Gold for accents
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
