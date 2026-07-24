/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./apps/**/*.{html,ts}", "./libs/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        bg3: "var(--bg3)",
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        "text-primary": "var(--text)",
        "text-secondary": "var(--text2)",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        heading: ["Syne", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
};
