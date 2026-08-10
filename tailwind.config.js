// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        oxford:  '#002147',
        rose:    '#654345',
        cream:   '#F4F0EC',
        muted:   '#6B6762',
        border:  '#E2DDD8',
      },
      fontFamily: {
        syne:   ['Syne', 'sans-serif'],
        sans:   ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,33,71,0.06), 0 4px 16px rgba(0,33,71,0.04)',
        lg:   '0 8px 32px rgba(0,33,71,0.10)',
      }
    }
  },
  plugins: []
}
