/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
          light: '#DCFCE7',
        },
        accent: '#208AEF',
        surface: '#FFFFFF',
        muted: '#F3F4F6',
        'muted-foreground': '#6B7280',
        border: '#E5E7EB',
        danger: '#DC2626',
        warning: '#D97706',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};
