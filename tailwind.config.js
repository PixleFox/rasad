/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        space: '#05080F',
        surface: '#0A111F',
        'neon-cyan': '#00D4FF',
        'neon-violet': '#7C3AED',
        'neon-green': '#00FF9D',
        'neon-gold': '#FBBF24',
        'neon-pink': '#FF3B6B',
        'text-primary': '#E8EDF5',
        'text-muted': '#6B7A93',
      },
      fontFamily: {
        dana: ['DanaFaNum', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'float-med': 'float 8s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.8), 0 0 60px rgba(0,212,255,0.3)' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2)',
        'neon-violet': '0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)',
        'neon-green': '0 0 15px rgba(0,255,157,0.5)',
        'neon-gold': '0 0 15px rgba(251,191,36,0.5)',
        'card-hover': '0 0 30px rgba(0,212,255,0.15), inset 0 0 30px rgba(0,212,255,0.05)',
      },
    },
  },
  plugins: [],
}

