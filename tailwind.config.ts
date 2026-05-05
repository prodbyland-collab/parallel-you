import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#060712",
        ink: "#101220",
        neon: "#8b5cf6",
        pulse: "#22d3ee",
        ember: "#fb7185",
        aurora: "#34d399"
      },
      boxShadow: {
        glow: "0 0 60px rgba(139, 92, 246, 0.25)",
        cyan: "0 0 50px rgba(34, 211, 238, 0.18)"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseSlow: "pulse 5s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
