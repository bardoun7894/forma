import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#070707',
        primary: {
          DEFAULT: '#00C4CC',
          hover: '#00e0e9',
          dim: 'rgba(0, 196, 204, 0.1)',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          dim: 'rgba(139, 92, 246, 0.1)',
        },
        neon: {
          cyan: '#00f5ff',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#00ff9d',
        },
        panel: 'rgba(255, 255, 255, 0.03)',
        'panel-hover': 'rgba(255, 255, 255, 0.05)',
        main: '#e2e8f0',
        muted: '#9ca3af',
        dim: '#4b5563',
      },
      boxShadow: {
        glow: '0 0 30px -5px rgba(0, 196, 204, 0.15)',
        'glow-strong': '0 0 50px rgba(0, 196, 204, 0.5)',
        'neon-glow': '0 0 10px rgba(0, 245, 255, 0.8), 0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.3)',
        'neon-glow-purple': '0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
        'neon-glow-pink': '0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Smaller base font sizes per requirements
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        sm: ['0.813rem', { lineHeight: '1.25rem' }],  // 13px
        base: ['0.875rem', { lineHeight: '1.5rem' }], // 14px (default body)
        lg: ['1rem', { lineHeight: '1.75rem' }],      // 16px
        xl: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 10s infinite',
        'glow': 'glow 1.5s infinite',
        'glow-cyan': 'glow-cyan 2s infinite',
        'glow-purple': 'glow-purple 2s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'beam-horizontal': 'beam-horizontal 10s linear infinite',
        'beam-vertical': 'beam-vertical 10s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px #00f5ff' },
          '50%': { boxShadow: '0 0 20px #00f5ff' }
        },
        'glow-cyan': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 245, 255, 0.8)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 245, 255, 0.8), 0 0 40px rgba(0, 245, 255, 0.5)' }
        },
        'glow-purple': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.8)' },
          '50%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.5)' }
        },
        'beam-horizontal': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'beam-vertical': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
