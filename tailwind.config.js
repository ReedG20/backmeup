/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './app/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#3C23FF',
        navy: {
          950: '#1a0f5c',
          900: '#2a1a8a',
          800: '#3A20E3',
          700: '#4d35e8',
          600: '#6b5ced',
        },
      },
    },
  },
  plugins: [],
};
