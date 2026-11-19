// Panel layouts for the cover: each layout names its panels as fractions of
// the cover (x, y, w, h in 0..1) and a title zone. The title zone is either
// overlaid on the art (hero) or a solid band along the foot (grid, strip).
export const LAYOUTS = {
  hero: {
    label: 'Hero + strip',
    panels: [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.56 },
      { x: 0.02, y: 0.6, w: 0.3067, h: 0.38 },
      { x: 0.3467, y: 0.6, w: 0.3067, h: 0.38 },
      { x: 0.6733, y: 0.6, w: 0.3067, h: 0.38 },
    ],
    title: { x: 0.04, y: 0.36, w: 0.92, h: 0.2, align: 'left', band: false },
  },
  grid: {
    label: 'Four-panel grid',
    panels: [
      { x: 0.02, y: 0.02, w: 0.47, h: 0.36 },
      { x: 0.51, y: 0.02, w: 0.47, h: 0.36 },
      { x: 0.02, y: 0.4, w: 0.47, h: 0.36 },
      { x: 0.51, y: 0.4, w: 0.47, h: 0.36 },
    ],
    title: { x: 0, y: 0.78, w: 1, h: 0.22, align: 'center', band: true },
  },
  strip: {
    label: 'Comic strip',
    panelsFor(w, h) {
      if (w >= h) {
        return [
          { x: 0.02, y: 0.02, w: 0.3067, h: 0.76 },
          { x: 0.3467, y: 0.02, w: 0.3067, h: 0.76 },
          { x: 0.6733, y: 0.02, w: 0.3067, h: 0.76 },
        ];
      }
      return [
        { x: 0.02, y: 0.02, w: 0.96, h: 0.24 },
        { x: 0.02, y: 0.28, w: 0.96, h: 0.24 },
        { x: 0.02, y: 0.54, w: 0.96, h: 0.22 },
      ];
    },
    title: { x: 0, y: 0.78, w: 1, h: 0.22, align: 'center', band: true },
  },
};

/** Panels for a layout at a cover of w by h pixels (fractions resolved). */
export function panelsForLayout(name, w, h) {
  const layout = LAYOUTS[name] ?? LAYOUTS.hero;
  if (layout.panelsFor) return layout.panelsFor(w, h);
  return layout.panels;
}

/** Title zone for a layout, in fractions. */
export function titleZoneForLayout(name) {
  return (LAYOUTS[name] ?? LAYOUTS.hero).title;
}

/** Number of panels a layout uses. */
export function panelCount(name) {
  return name === 'strip' ? 3 : 4;
}
