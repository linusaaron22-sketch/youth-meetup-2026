import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { 50: "#f1f6f2", 100: "#dce9de", 200: "#bad3bf", 300: "#8db596", 400: "#5f9470", 500: "#3f7653", 600: "#2e5e41", 700: "#264c36", 800: "#1f3d2b", 900: "#14291d" },
        gold: { 50: "#fbf7ee", 100: "#f4ead2", 200: "#e8d4a2", 300: "#d6b878", 400: "#c4a265", 500: "#b08d57", 600: "#8f7140" },
        ivory: { 50: "#fdfbf5", 100: "#f8f3e6", 200: "#efe7d0" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
