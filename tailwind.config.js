export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#fef3c7', 100: '#fde68a', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        magic: { 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
      },
      fontFamily: { fun: ['"Nunito"', 'sans-serif'] },
    },
  },
  plugins: [],
}
