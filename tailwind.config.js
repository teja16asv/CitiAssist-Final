/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'civic-start': '#FDFCFB',
        'civic-end': '#E2D1C3',
        'civic-text': '#44403C', // stone-700 equivalent
        'civic-accent': '#78716C', // stone-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'civic-gradient': 'linear-gradient(to bottom, #FDFCFB, #E2D1C3)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
