/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#5C2ECD',
          700: '#6D28D9',
        },
        pink: {
          500: '#EC4899',
          600: '#ED017F',
        },
        purple: {
          600: '#5C2ECD',
          700: '#6D28D9',
        },
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      borderRadius: {
        '10px': '10px',
        '12px': '12px',
        '14px': '14px',
        '22px': '22px',
      },
      boxShadow: {
        'purple-sm': '0 8px 32px rgba(92,46,205,0.3)',
        'purple-lg': '0 8px 40px rgba(109,40,217,0.12)',
        'success': '0 12px 30px rgba(34,197,94,0.25)',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
    },
  },
  plugins: [],
}