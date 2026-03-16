/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.25s ease-out forwards',
      },
      colors: {
        dark: {
          900: '#0F0F0F',
          800: '#1A1A1A',
          700: '#1E1E1E',
          600: '#2A2A2A',
          500: '#3A3A3A',
        },
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF9A00',
          600: '#FF6B00',
          700: '#C2410C',
        },
      },
    },
  },
  plugins: [],
};
