/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f4fce3',
          100: '#e5f7bd',
          200: '#ceef82',
          300: '#b5e245',
          400: '#a3d420',
          500: '#8cb918',
          600: '#6d9212',
          700: '#526e0d',
          800: '#3d5010',
          900: '#2e3c0a',
          950: '#1a2205',
        },
      },
    },
  },
  plugins: [],
};
