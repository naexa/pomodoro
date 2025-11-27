/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Contribution calendar colors
        'contrib-0': '#ebedf0',
        'contrib-1': '#9be9a8',
        'contrib-2': '#40c463',
        'contrib-3': '#30a14e',
        'contrib-4': '#216e39',
      },
    },
  },
  plugins: [],
}
