import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // H. brand palette — placeholder values, swap once brand guide exists.
        ink: '#111111',
        paper: '#faf9f7',
        accent: '#8a1c1c',
        muted: '#6b6b6b',
        border: '#e5e2dd',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
      },
      maxWidth: {
        container: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
