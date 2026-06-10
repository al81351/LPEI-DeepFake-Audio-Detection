/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './src/components/ui/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        foreground: 'oklch(90% 0.005 260)',
        'blue-500':  '#3b82f6',
        'blue-600':  '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'neon-pulse':    'neon-pulse 2.5s ease-in-out infinite',
        'border-pulse':  'border-pulse 1.5s ease-in-out infinite',
        'fade-in':       'fade-in 400ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':      'slide-up 500ms cubic-bezier(0.16,1,0.3,1) both',
        'capture-pulse': 'capture-pulse 2s ease-in-out infinite',
        'dot-blink':     'dot-blink 1.2s ease-in-out infinite',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': {
            textShadow:
              '0 0 8px var(--color-accent), 0 0 20px var(--color-accent), 0 0 40px var(--color-accent)',
          },
          '50%': {
            textShadow: '0 0 4px var(--color-accent), 0 0 10px var(--color-accent)',
          },
        },
        'border-pulse': {
          '0%, 100%': {
            boxShadow:
              '0 0 0 0 rgba(255,51,102,0.5), inset 0 0 0 1px rgba(255,51,102,0.7)',
          },
          '50%': {
            boxShadow:
              '0 0 0 8px rgba(255,51,102,0), inset 0 0 0 1px rgba(255,51,102,1)',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'capture-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,255,136,0.5)' },
          '50%':       { boxShadow: '0 0 0 10px rgba(0,255,136,0)' },
        },
        'dot-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.2' },
        },
      },
    },
  },
  plugins: [],
}
