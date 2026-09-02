/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f6ff',
          100: '#e0ecff',
          500: '#3b82f6', // Soft professional blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#10b981', // Soft green
          600: '#059669',
        },
        accent: {
          500: '#f97316', // Soft orange
          600: '#ea580c',
        },
        error: {
          500: '#ef4444', // Soft red
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
