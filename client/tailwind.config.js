/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#1B4332', // Deep forest green
          900: '#0f291e',
          950: '#081c15',
        },
        sage: {
          50: '#f4fbf7',
          100: '#e8f7ee',
          200: '#d8f3dc',
          300: '#b7e4c7',
          400: '#95d5b2',
          500: '#74c69d',
          600: '#52b788',
          700: '#40916c',
          800: '#2d6a4f',
          900: '#1b4332',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f4ecd9',
          300: '#ede1bf',
          400: '#e4d3a0',
          500: '#d7bf7f',
        },
        terracotta: {
          50: '#fdf5f2',
          100: '#fae8e3',
          200: '#f6d5ca',
          300: '#eeb8a6',
          400: '#e07a5f', // subtle muted orange/terracotta
          500: '#cb5c40',
          600: '#b3472c',
        },
        charcoal: {
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
          600: '#4b5563',
          500: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(27, 67, 50, 0.05), 0 2px 4px -1px rgba(27, 67, 50, 0.03)',
        'card-hover': '0 12px 24px -4px rgba(27, 67, 50, 0.08), 0 4px 6px -2px rgba(27, 67, 50, 0.04)',
      }
    },
  },
  plugins: [],
}
