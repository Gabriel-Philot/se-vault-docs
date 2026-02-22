import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pal: {
          bg: "#1a1714",
          panel: "#2a2520",
          gold: "#c9a84c",
          green: "#4a9e6e",
          blue: "#5b8fb9",
          red: "#c0392b",
          text: "#e8dcc8",
          muted: "#8a7e6b"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(201,168,76,0.25)"
      }
    }
  },
  plugins: []
} satisfies Config;
