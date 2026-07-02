/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        // Named palette (preferred)
        'eb-deep-plum':      'var(--deep-plum)',
        'eb-plum':           'var(--plum)',
        'eb-mid-plum':       'var(--mid-plum)',
        'eb-light-plum':     'var(--light-plum)',
        'eb-almond-oil':     'var(--almond-oil)',
        'eb-parchment':      'var(--parchment)',
        'eb-ebright-red':    'var(--ebright-red)',
        'eb-milk':           'var(--milk)',
        'eb-soft-lavender':  'var(--soft-lavender)',
        'eb-ink':            'var(--ink)',
        'eb-ink-soft':       'var(--ink-soft)',
        // Legacy named tokens — kept for back-compat, repointed in CSS vars
        'eb-walnut':      'var(--walnut)',
        'eb-oak':         'var(--oak)',
        'eb-timber':      'var(--timber)',
        'eb-gold':        'var(--pixel-gold)',
        'eb-chalk':       'var(--chalk-white)',

        // Brand (legacy aliases — keep existing JSX working)
        'eb-red':        'var(--red)',
        'eb-red-bright': 'var(--red-bright)',
        'eb-red-dark':   'var(--red-dark)',
        'eb-yellow':     'var(--yellow)',
        'eb-yellow-dark':'var(--yellow-dark)',
        'eb-green':      'var(--green)',
        'eb-green-dark': 'var(--green-dark)',
        'eb-white':      'var(--white)',
        // Surfaces (legacy → palette)
        'eb-dark':       'var(--dark)',
        'eb-surface-0':  'var(--surface-0)',
        'eb-surface-1':  'var(--surface-1)',
        'eb-card':       'var(--card)',
        'eb-surface-2':  'var(--surface-2)',
        'eb-surface-3':  'var(--surface-3)',
        'eb-surface-4':  'var(--surface-4)',
        // Borders
        'eb-border-1':   'var(--border-1)',
        'eb-border-2':   'var(--border-2)',
        'eb-border-3':   'var(--border-3)',
      },
      fontFamily: {
        // Pixel font for headers and the Get Started CTA.
        pixel:  ['"Press Start 2P"', 'monospace'],
        quest:  ['"Press Start 2P"', 'monospace'],
        // Body / paragraphs / cards → Nunito.
        body:   ['Nunito', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        heading:['Nunito', 'sans-serif'],
      },
      fontSize: {
        'pixel-xs': ['0.45rem', { letterSpacing: '0.1em' }],
        'pixel-sm': ['0.55rem', { letterSpacing: '0.1em' }],
        'pixel-md': ['0.7rem', { letterSpacing: '0.1em' }],
        'pixel-lg': ['1rem', { letterSpacing: '0.1em' }],
        'pixel-xl': ['2rem', { letterSpacing: '0.15em' }],
      },
      boxShadow: {
        pixel:        '0 5px 0 var(--red-dark)',
        'pixel-lg':   '0 8px 24px rgba(26, 11, 31, 0.5)',
        'glow-red':   '0 0 24px rgba(55, 25, 49, 0.55)',
        'glow-yellow':'0 0 18px rgba(212, 168, 212, 0.5)',
      },
      zIndex: {
        scanline: '999',
        'modal-back': '900',
        'minigame-overlay': '800',
        'page-nav': '190',
        'progress-bar': '190',
        'top-nav': '200',
        'village-hud': '100',
      },
    },
  },
  plugins: [],
};
