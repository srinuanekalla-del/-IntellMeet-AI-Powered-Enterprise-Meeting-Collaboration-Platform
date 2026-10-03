/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          500: '#3b6df0',
          600: '#2f57cc',
          700: '#2645a3',
        },
      },
    },
  },
  plugins: [],
};
