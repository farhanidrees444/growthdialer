import type { Config } from 'tailwindcss';

/**
 * Enterprise + marketing design tokens — complements @theme in app/globals.css (Tailwind v4).
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
        brand: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          glow: '#7C3AED33',
        },
        surface: {
          0: '#08080A',
          1: '#0F0F12',
          2: '#16161A',
          3: '#1E1E24',
        },
      },
      boxShadow: {
        'enterprise-hover': '0 0 0 1px rgb(39 39 42 / 0.5), 0 0 24px -8px rgb(255 255 255 / 0.06)',
        'brand-hover': '0 0 0 1px rgb(139 92 246 / 0.2), 0 0 28px -6px rgb(139 92 246 / 0.15)',
        'hero-mock': '0 40px 80px rgba(0,0,0,0.6)',
        'card-hover': '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.2)',
      },
    },
  },
} satisfies Config;

export default config;
