/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#5B5FEF',
        bg: {
          light: '#FAFAFA',
          dark: '#1C1C1E'
        },
        card: {
          light: '#FFFFFF',
          dark: '#2C2C2E'
        },
        border: {
          light: '#E5E5EA',
          dark: '#38383A'
        },
        text: {
          primary: {
            light: '#1D1D1F',
            dark: '#F5F5F7'
          },
          secondary: {
            light: '#6E6E73',
            dark: '#98989D'
          }
        },
        priority: {
          high: '#FF3B30',
          medium: '#FF9F0A',
          low: '#34C759'
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Playfair Display"', 'serif'],
        voice: ['"Playfair Display"', 'serif'],
        numbers: ['"Space Grotesk"', 'sans-serif'],
        ui: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
