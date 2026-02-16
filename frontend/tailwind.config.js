/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      // Accessibility: larger touch targets & readable fonts
      minHeight: {
        touch: "64px",
      },
      minWidth: {
        touch: "64px",
      },
      fontSize: {
        "accessible-sm": ["16px", "24px"],
        "accessible-base": ["18px", "28px"],
        "accessible-lg": ["22px", "32px"],
        "accessible-xl": ["28px", "36px"],
      },
    },
  },
  plugins: [],
};
