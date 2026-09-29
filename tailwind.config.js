// Design tokens (palette A — "clean blue"). Components use these names
// (text-brand, text-ink, text-muted, border-line, bg-paper, *-status-*),
// so changing a value here restyles the whole app.
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          soft: "#EFF6FF",
        },
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        paper: "#F8FAFC",
        status: {
          review: "#B45309",
          revision: "#B91C1C",
          approved: "#15803D",
        },
      },
    },
  },
  plugins: [],
};
