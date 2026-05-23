import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101010",
        paper: "#fffdf2",
        acid: "#caff00",
        coral: "#ff6b4a",
        sky: "#58c7ff",
        violet: "#8f5cff"
      },
      boxShadow: {
        brutal: "6px 6px 0 #101010",
        brutalSm: "3px 3px 0 #101010"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
