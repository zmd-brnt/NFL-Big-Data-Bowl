/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        turf: '#10201A', pitch: '#0C1812', chalk: '#EEF1EA', mute: '#9DB0A5',
        ref: '#4C8DFF', hl: '#FFD43B', coral: '#FF6B5E', line: 'rgba(238,241,234,0.13)',
      },
      fontFamily: { flap: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'] },
      letterSpacing: { display: '-0.024em' },
    },
  },
  plugins: [],
}
