/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#030303',
        'bg-surface': '#181818',
        'bg-surface-light': '#282828',
        'text-primary': '#ffffff',
        'text-secondary': '#aaaaaa',
        'brand': '#ff0000',
      },
    },
  },
  plugins: [],
} 