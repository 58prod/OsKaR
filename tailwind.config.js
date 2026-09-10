/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette OsKaR (hasenso.fr/oskar)
        navy: {
          DEFAULT: '#1e2d7d',
          dark: '#151f5e',
          light: '#2a3d99',
        },
        teal: {
          DEFAULT: '#00d4b4',
          dark: '#00b89c',
          light: '#e0faf6',
        },
        coral: {
          DEFAULT: '#ffa089',
          dark: '#e2653f',
          light: '#fff0ea',
        },
        ink: '#1a1a2e',
        muted: '#6b7280',
        surface: '#f5f6fa',
        line: '#e2e4f0',

        // Couleurs des 5 piliers, nommees par le pilier qu'elles designent.
        // Memes valeurs que les echelles generiques ci-dessous : on ajoute le
        // vocabulaire metier des maquettes, on ne change aucune couleur.
        vision: {
          DEFAULT: '#0ea5e9', // = primary.500
          dark: '#0284c7',    // = primary.600
          light: '#e0f2fe',   // = primary.100
        },
        fit: {
          DEFAULT: '#22c55e', // = success.500
          dark: '#16a34a',    // = success.600
          light: '#dcfce7',   // = success.100
        },
        finance: {
          DEFAULT: '#f59e0b', // = warning.500
          dark: '#d97706',    // = warning.600
          light: '#fef3c7',   // = warning.100
        },
        okr: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#ede9fe',
        },
        team: {
          DEFAULT: '#ec4899',
          dark: '#db2777',
          light: '#fce7f3',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },

      /*
       * Echelle typographique des maquettes (oskar.css), relevee telle quelle.
       * Elle procede par demi-pixels : aucune de ces valeurs n'existe dans
       * l'echelle par defaut de Tailwind, ce qui a conduit a arrondir au cran
       * le plus proche (text-sm = 14 au lieu de 14.5 ou 15.5, text-2xl = 24 au
       * lieu de 25.5...) et a faire deriver toute l'application de 1 a 2 px.
       *
       * Utiliser text-15.5 plutot que text-sm des qu'on transpose une maquette.
       * L'interligne est celui observe dans oskar.css ; 1.6 quand la regle
       * n'en declare pas (valeur heritee du body).
       *
       * Les crans Tailwind d'origine restent disponibles : la migration des
       * ecrans deja ecrits se fait progressivement, ecran par ecran.
       */
      fontSize: {
        '10.5': ['10.5px', { lineHeight: '1.6' }],
        '11': ['11px', { lineHeight: '1.6' }],
        '11.5': ['11.5px', { lineHeight: '1.6' }],
        '12': ['12px', { lineHeight: '1.6' }],
        '12.5': ['12.5px', { lineHeight: '1.6' }],
        '13': ['13px', { lineHeight: '1.6' }],
        '13.5': ['13.5px', { lineHeight: '1.6' }],
        '14': ['14px', { lineHeight: '1.6' }],
        '14.5': ['14.5px', { lineHeight: '1.6' }],
        '15': ['15px', { lineHeight: '1.6' }],
        '15.5': ['15.5px', { lineHeight: '1.6' }],
        '16': ['16px', { lineHeight: '1.6' }],
        '16.5': ['16.5px', { lineHeight: '1.7' }],
        '17': ['17px', { lineHeight: '1.6' }],
        '17.5': ['17.5px', { lineHeight: '1.6' }],
        '18.5': ['18.5px', { lineHeight: '1.6' }],
        '19.5': ['19.5px', { lineHeight: '1.6' }],
        '20.5': ['20.5px', { lineHeight: '1.6' }],
        '22': ['22px', { lineHeight: '1.1' }],
        '23': ['23px', { lineHeight: '1.15' }],
        '25.5': ['25.5px', { lineHeight: '1.25' }],
        '27.5': ['27.5px', { lineHeight: '1.2' }],
        '29': ['29px', { lineHeight: '1.3' }],
        '32': ['32px', { lineHeight: '1.25' }],
        '34.5': ['34.5px', { lineHeight: '1.2' }],
        '41.5': ['41.5px', { lineHeight: '1.05' }],
      },
      borderRadius: {
        card: '12px',
      },
      // La maquette anime le menu lateral en 0.25s ; l'echelle Tailwind
      // s'arrete a 200 puis 300, d'ou ce cran supplementaire.
      transitionDuration: {
        250: '250ms',
      },
      boxShadow: {
        card: '0 2px 16px rgba(30,45,125,0.08)',
        'card-hover': '0 8px 32px rgba(30,45,125,0.14)',
        'auth-modal': '0 24px 80px rgba(15,20,60,0.25)',
      },
      maxWidth: {
        // Largeur du conteneur de page des maquettes : `.page-content` est
        // declare a 1200px puis ramene a 1400px par l'override d'oskar.css.
        content: '1400px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        wobble: 'wobble 0.7s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}
