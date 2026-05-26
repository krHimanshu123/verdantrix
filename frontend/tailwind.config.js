/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        slatepane: "#111827",
        graphite: "#1f2937",
        mist: "#94a3b8",
        cloud: "#e2e8f0",
        borderline: "#243041",
        ember: "#f97316",
        moss: "#15803d",
        signal: "#dc2626"
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        panel: "0 20px 40px rgba(15, 23, 42, 0.16)"
      }
    }
  },
  plugins: []
};
