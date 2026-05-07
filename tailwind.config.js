/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        ink: '#111827',
        muted: '#6B7280',
        surface: '#FFFFFF',
        canvas: '#F8FAFC',
        danger: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B'
      },
      borderRadius: {
        xl2: '20px',
        xl3: '28px'
      }
    },
  },
  plugins: [],
};
