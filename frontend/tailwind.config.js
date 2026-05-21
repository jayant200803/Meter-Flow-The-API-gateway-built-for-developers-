/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      opacity: {
        '3':  '0.03',
        '8':  '0.08',
        '12': '0.12',
        '15': '0.15',
        '18': '0.18',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in':    'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':   'spin 3s linear infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'counter':     'counterUp 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                    to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(99,102,241,0.6)' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(99,102,241,0.3)',
        'glow-green': '0 0 20px rgba(16,185,129,0.3)',
        'glow-red':   '0 0 20px rgba(239,68,68,0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':       '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.4)',
        'modal':      '0 25px 50px rgba(0,0,0,0.7)',
      },
    },
  },
  plugins: [],
};
