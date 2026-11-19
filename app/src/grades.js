// Colour grades: Vice City sunset and neon looks applied over every panel as
// gradient tints, a soft-light wash, a vignette and grain (see cover.js).
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    bg: '#1c0b33',
    top: 'rgba(255, 183, 76, 0)',
    bottom: 'rgba(214, 51, 132, 0.42)',
    wash: 'rgba(255, 110, 60, 0.16)',
    band: ['#2b1055', '#c2185b', '#ff7a18'],
    accent: '#ffd319',
  },
  neon: {
    label: 'Neon Nights',
    bg: '#0a0618',
    top: 'rgba(0, 229, 255, 0)',
    bottom: 'rgba(255, 46, 136, 0.5)',
    wash: 'rgba(0, 229, 255, 0.14)',
    band: ['#12082e', '#7b2ff7', '#ff2e88'],
    accent: '#00e5ff',
  },
  gold: {
    label: 'Palm Gold',
    bg: '#241505',
    top: 'rgba(255, 214, 64, 0)',
    bottom: 'rgba(180, 83, 9, 0.45)',
    wash: 'rgba(255, 180, 40, 0.18)',
    band: ['#3a2203', '#b45309', '#fbbf24'],
    accent: '#ffe08a',
  },
  vice: {
    label: 'Miami Vice',
    bg: '#160a2e',
    top: 'rgba(255, 45, 149, 0)',
    bottom: 'rgba(0, 184, 212, 0.42)',
    wash: 'rgba(255, 45, 149, 0.15)',
    band: ['#1d0b3d', '#ff2d95', '#00b8d4'],
    accent: '#ff5db1',
  },
  noir: {
    label: 'Noir Heat',
    bg: '#0d0d12',
    top: 'rgba(255, 255, 255, 0)',
    bottom: 'rgba(120, 20, 60, 0.5)',
    wash: 'rgba(10, 10, 20, 0.22)',
    band: ['#14141c', '#3d0c2e', '#8a1538'],
    accent: '#e8e8e8',
  },
};

/** The export sizes the app offers. */
export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  landscape: { label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
};

/** Caption ink choices. */
export const INKS = {
  white: { label: 'White', fill: '#ffffff' },
  sunset: { label: 'Sunset gradient', gradient: ['#ffd319', '#ff2975', '#8c1eff'] },
  neon: { label: 'Neon pink', fill: '#ff2e88' },
  gold: { label: 'Gold', fill: '#ffd319' },
};
