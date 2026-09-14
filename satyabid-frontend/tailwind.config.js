/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ---- SatyaBid enterprise/government theme (v2) ----
        // Deep navy chrome, stark white content, amber accent, sharp status colors.
        // Legacy token names are kept so every existing page picks up the new
        // palette automatically without markup changes.
        navy: {
          950: '#081826', // near-black navy — sidebar / hero / max-emphasis text
          900: '#0B2136', // primary chrome — sidebar background
          800: '#122C44', // raised chrome panels within the sidebar
          700: '#1C3A55', // borders/dividers on dark surfaces
          600: '#2B4F6E', // muted text/icons on dark surfaces
        },
        saffron: {
          50: '#FFF4EB',
          100: '#FEE3C8',
          500: '#F97316', // primary CTA — amber/orange
          600: '#EA580C', // hover / pressed
          700: '#C2410C',
        },
        status: {
          verified: '#15803D',
          fail: '#B91C1C',
          review: '#B45309',
          info: '#1D4ED8',
        },
        // ---- Extended palette (new/updated UI) ----
        gold: '#B8860B',
        gembi: '#1D4ED8', // links, info states, selected data
        brightorange: '#F97316',
        gemgreen: '#15803D',
        surface: {
          main: '#F8FAFC',   // page background — off-white
          page: '#F8FAFC',
          card: '#FFFFFF',    // stark white content cards
          secondary: '#F1F5F9',
          dark: '#0B2136',
        },
        ink: {
          DEFAULT: '#0F1E2C',  // primary text
          heading: '#081826',
          secondary: '#51677A',
          muted: '#8B99A6',
          link: '#1D4ED8',
        },
        line: {
          DEFAULT: '#E2E8F0',
          light: '#EEF2F6',
          dark: '#1C3A55',
        },
        success: { DEFAULT: '#15803D', bg: '#EAF6EE' },
        warning: { DEFAULT: '#B45309', bg: '#FEF3E2' },
        danger: { DEFAULT: '#B91C1C', bg: '#FCEAEA' },
        info: { DEFAULT: '#1D4ED8', bg: '#EAF0FD' },
        pending: { DEFAULT: '#9A5B0A', bg: '#FDF1DF' },
      },
      fontFamily: {
        // Serif for headings/authority, clean sans for data & body.
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        // A slightly wider display scale for the serif headings.
        'display-sm': ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'display-md': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.012em' }],
        'display-lg': ['2.5rem', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
        'display-xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(8, 24, 38, 0.06), 0 1px 0 rgba(8,24,38,0.04)',
        elevated: '0 8px 24px -8px rgba(8, 24, 38, 0.18), 0 1px 2px rgba(8,24,38,0.06)',
        panel: '0 1px 0 rgba(8,24,38,0.04), 0 12px 32px -16px rgba(8,24,38,0.14)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
}
