/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00',
          hover: '#E85D00',
        },
        novaorange: {
          50: '#fff4eb',
          100: '#ffe5d1',
          200: '#ffc8a3',
          300: '#ffa66b',
          400: '#ff8233',
          500: '#FF6B00', // Primary Header & Action Orange (#FF6B00)
          600: '#E85D00', // Button Hover (#E85D00)
          700: '#c24900',
          800: '#9e3900',
          900: '#7d2c00',
        },
        novablue: {
          50: '#fff4eb',
          100: '#ffe5d1',
          200: '#ffc8a3',
          300: '#ffa66b',
          400: '#ff8233',
          500: '#FF6B00',
          600: '#E85D00',
          700: '#c24900',
        },
        novayellow: {
          400: '#ffeb3b',
          500: '#ffe500', // Plus / SuperCoin Yellow
          600: '#f5c518',
        },
        novagreen: {
          50: '#F4FBF7',
          100: '#E8F5EE',
          500: '#2E8B57', // Main Sea Green
          600: '#236B45', // Dark Sea Green
        },
        seagreen: {
          50: '#F4FBF7',  // Very Light Background
          100: '#E8F5EE', // Light Sea Green (Main Website Background)
          200: '#d0ebd9',
          300: '#a3d9b8',
          400: '#62b885',
          500: '#2E8B57', // Main Sea Green
          600: '#277a4d',
          700: '#236B45', // Dark Sea Green (Footer)
          800: '#1b5234',
          900: '#133a25',
        },
        novadark: {
          800: '#1b5234',
          900: '#236B45', // Dark Sea Green Footer (#236B45)
        },
        novagray: {
          50: '#F4FBF7',
          100: '#E8F5EE', // Light Sea Green Body Background
          200: '#d0ebd9',
          300: '#a3d9b8',
          400: '#62b885',
          500: '#2E8B57',
        },
        siteText: '#17211B', // Clean Dark Text
      },
      textColor: {
        dark: '#17211B',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(35, 107, 69, 0.08), 0 2px 8px 0 rgba(35, 107, 69, 0.04)',
        'card-hover': '0 4px 16px 0 rgba(35, 107, 69, 0.12)',
        'header': '0 2px 4px 0 rgba(0, 0, 0, 0.12)',
        'floating': '0 8px 30px rgba(35, 107, 69, 0.12)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
