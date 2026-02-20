import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bronze: {
          50: '#f7efe4',
          100: '#ecd8c1',
          300: '#d2a978',
          500: '#ad6f3b',
          700: '#7a4926',
          900: '#2b1710',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        warm: '0 12px 30px rgba(33, 18, 12, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
