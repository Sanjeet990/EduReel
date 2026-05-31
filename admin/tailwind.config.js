/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0A0A0F', surface: '#141420', elevated: '#1A1A2A' },
        border: '#2A2A3A',
        accent: { DEFAULT: '#7C6FE8', light: '#A89FF0' },
        success: '#44CC99',
        warning: '#CAAA80',
      }
    },
  },
  plugins: [],
}
