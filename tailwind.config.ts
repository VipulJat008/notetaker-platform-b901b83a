import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'color-primary': '#0F172A',
        'color-secondary': '#1E293B',
        'color-cta': '#22C55E',
        'color-background': '#020617',
        'color-text': '#F8FAFC',
        'color-destructive': '#EF4444',
        'color-warning': '#F59E0B',
        'color-info': '#3B82F6',
      },
      fontFamily: {
        code: ['"Fira Code"', 'monospace'],
        sans: ['"Fira Sans"', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
        btn: '8px',
      },
      maxWidth: {
        content: '1280px',
        'login-card': '480px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'ping-once': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%': { transform: 'scale(2)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down': 'slideDown 250ms ease forwards',
        'fade-in': 'fadeIn 300ms ease forwards',
        'ping-once': 'ping-once 1s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
