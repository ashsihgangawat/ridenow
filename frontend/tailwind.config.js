/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./customer/**/*.{js,ts,jsx,tsx}",
    "./driver/**/*.{js,ts,jsx,tsx}",
    "./admin/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#09090b',
          void: '#000000',
          card: '#121217',
          cardHover: '#1c1c24',
          border: '#2a2a35',
          yellow: '#facc15',
          yellowDark: '#ca8a04',
          gold: '#eab308',
          amber: '#f59e0b',
          // Backward compatibility mappings for legacy cyber tokens
          red: '#facc15',
          redDark: '#ca8a04',
          crimson: '#eab308',
          neonPink: '#fef08a',
          cyan: '#facc15',
          violet: '#f59e0b',
        }
      },
      boxShadow: {
        'neon-yellow': '0 0 25px rgba(250, 204, 21, 0.4)',
        'neon-yellow-sm': '0 0 12px rgba(250, 204, 21, 0.25)',
        'neon-red': '0 0 25px rgba(250, 204, 21, 0.4)',
        'neon-red-sm': '0 0 12px rgba(250, 204, 21, 0.25)',
        'neon-cyan': '0 0 20px rgba(250, 204, 21, 0.3)',
      },
      backgroundImage: {
        'circuit-glow': 'radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.15) 0%, transparent 60%)',
        'yellow-gradient': 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
        'red-gradient': 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
        'cyber-gradient': 'linear-gradient(180deg, #121217 0%, #000000 100%)',
      }
    },
  },
  plugins: [],
}
