/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mpc: {
          bg: '#1a1a2e',
          surface: '#16213e',
          panel: '#0f3460',
          pad: '#533483',
          'pad-active': '#e94560',
          accent: '#e94560',
          'accent-glow': '#ff6b6b',
          text: '#eee',
          'text-dim': '#8899aa',
          knob: '#2a2a4a',
          'knob-ring': '#e94560',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'pad': '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'pad-active': '0 0 20px rgba(233, 69, 96, 0.6), 0 0 40px rgba(233, 69, 96, 0.3)',
        'knob': '0 2px 8px rgba(0, 0, 0, 0.5)',
        'panel': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pad-glow': 'padGlow 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        padGlow: {
          '0%': { boxShadow: '0 0 30px rgba(233, 69, 96, 0.8), 0 0 60px rgba(233, 69, 96, 0.4)' },
          '100%': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)' },
        },
      },
    },
  },
  plugins: [],
};
