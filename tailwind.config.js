/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50:  '#f6f7f0',
          100: '#eaeed8',
          200: '#d4ddb3',
          300: '#b8c785',
          400: '#9cb05e',
          500: '#7d9441',
          600: '#627533',
          700: '#4c5a28',
          800: '#3d4821',
          900: '#333c1d',
        },
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
