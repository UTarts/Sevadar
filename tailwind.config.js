/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#FF9933', // Saffron
            dark: '#D43031',    // Deep Red
            light: '#FFB866',   // Soft Orange
          },
          secondary: {
            DEFAULT: '#2E0249', // Royal Purple
            accent: '#A91079',  // Festive Pink
          },
        },
        fontFamily: {
          sans: ['var(--font-poppins)', 'sans-serif'],
          hindi: ['var(--font-tiro)', 'serif'],
          hand: ['var(--font-kalam)', 'cursive'],
        },
        backgroundImage: {
          'modern-gradient': 'linear-gradient(135deg, #FF9933 0%, #D43031 50%, #2E0249 100%)',
        }
      },
    },
    plugins: [],
  };