import type { Config } from 'tailwindcss';

/**
 * Enterprise design tokens — complements @theme in app/globals.css (Tailwind v4).
 * Palette: zinc-950 canvas, zinc-900 surfaces, zinc-800/50 borders.
 */
const config = {
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '0.75rem',
        sm: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      colors: {
        enterprise: {
          canvas: '#09090b',
          surface: '#18181b',
          border: 'rgb(39 39 42 / 0.5)',
        },
      },
      boxShadow: {
        'enterprise-hover': '0 0 0 1px rgb(39 39 42 / 0.5), 0 0 24px -8px rgb(255 255 255 / 0.06)',
        'brand-hover': '0 0 0 1px rgb(139 92 246 / 0.2), 0 0 28px -6px rgb(139 92 246 / 0.15)',
      },
    },
  },
} satisfies Config;

export default config;
