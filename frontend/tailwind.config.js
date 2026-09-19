// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          DEFAULT: "#0ff",
          dark: "#00ffcc"
        }
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
