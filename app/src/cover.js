// Draws the cover: multi-panel photos with a sunset/neon grade, bold Anton
// caption lettering with a Pacifico subtitle, halftone title band, vignette
// and grain. One function, drawCover, renders at any size, so the live
// preview and the exported PNG are the same drawing.
import { panelsForLayout, titleZoneForLayout } from './layouts.js';
import { GRADES, INKS } from './grades.js';

let grainPattern = null;

/** Builds a small tiled noise pattern used for film grain. */
function getGrain(ctx) {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 20);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's pan/zoom. */
export function drawPanelPhoto(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const zoom = panel?.zoom ?? 1;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const ox = (panel?.ox ?? 0) * w;
    const oy = (panel?.oy ?? 0) * h;
    ctx.drawImage(img, x + (w - pw) / 2 + ox, y + (h - ph) / 2 + oy, pw, ph);
  } else {
    ctx.fillStyle = '#241a33';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/** Applies the grade's tint and wash over one panel rect. */
export function gradePanel(ctx, grade, rect) {
  const { x, y, w, h } = rect;
  const tint = ctx.createLinearGradient(0, y, 0, y + h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** White frame and a soft inner shade around one panel rect. */
export function framePanel(ctx, rect, line) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = line;
  ctx.strokeRect(rect.x + line / 2, rect.y + line / 2, rect.w - line, rect.h - line);
  const shade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
  shade.addColorStop(0.12, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(0.88, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Wraps text into at most two lines that fit maxWidth at the given font. */
function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
    else {
      lines.push(line);
      line = word;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
}

/** Draws the caption (and subtitle) inside the title zone. */
export function drawCaption(ctx, state, zone, W, H) {
  const grade = GRADES[state.grade];
  const zx = zone.x * W;
  const zy = zone.y * H;
  const zw = zone.w * W;
  const zh = zone.h * H;
  const text = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();

  if (zone.band) {
    const band = ctx.createLinearGradient(0, zy, 0, zy + zh);
    band.addColorStop(0, grade.band[0]);
    band.addColorStop(0.55, grade.band[1]);
    band.addColorStop(1, grade.band[2]);
    ctx.fillStyle = band;
    ctx.fillRect(zx, zy, zw, zh);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(zx, zy, zw, Math.max(2, H * 0.004));
    // Halftone dots fading down the band.
    const step = Math.max(9, W * 0.012);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    for (let yy = zy + step * 0.7; yy < zy + zh; yy += step) {
      for (let xx = zx + step / 2; xx < zx + zw; xx += step) {
        ctx.beginPath();
        ctx.arc(xx, yy, Math.max(1, step * 0.09), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Soft dark shade behind overlaid lettering so it reads over any photo.
    const shade = ctx.createLinearGradient(0, zy - zh * 0.4, 0, zy + zh);
    shade.addColorStop(0, 'rgba(12, 0, 24, 0)');
    shade.addColorStop(1, 'rgba(12, 0, 24, 0.6)');
    ctx.fillStyle = shade;
    ctx.fillRect(zx - W * 0.02, zy - zh * 0.4, zw + W * 0.04, zh * 1.4);
  }

  if (!text) return;
  const ink = INKS[state.ink] ?? INKS.white;
  const align = zone.align;
  const cx = align === 'center' ? zx + zw / 2 : zx;
  ctx.textAlign = align === 'center' ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';

  // Fit the title: shrink until one or two lines fit the zone.
  let size = zh * 0.58 * (state.titleSize ?? 1);
  let lines = [];
  while (size > H * 0.02) {
    ctx.font = `400 ${size}px Anton, 'Arial Narrow', sans-serif`;
    lines = wrapTitle(ctx, text, zw * 0.94);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= zw * 0.94) break;
    size *= 0.92;
  }
  const lineHeight = size * 0.98;
  const blockH = lines.length * lineHeight;
  const subH = sub ? size * 0.42 : 0;
  let top = zy + (zh - blockH - subH) / 2 + size * 0.82;

  const paint = (drawY) => {
    lines.forEach((line, i) => {
      const y = drawY + i * lineHeight;
      if (state.outline) {
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(10, 0, 18, 0.9)';
        ctx.lineWidth = Math.max(2, size * 0.09);
        ctx.strokeText(line, cx, y);
      }
      if (ink.gradient) {
        const g = ctx.createLinearGradient(cx - zw / 2, 0, cx + zw / 2, 0);
        g.addColorStop(0, ink.gradient[0]);
        g.addColorStop(0.55, ink.gradient[1]);
        g.addColorStop(1, ink.gradient[2]);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = ink.fill;
      }
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = size * 0.08;
      ctx.shadowOffsetY = size * 0.03;
      ctx.fillText(line, cx, y);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    });
  };
  paint(top);

  if (sub) {
    const subSize = Math.max(H * 0.018, size * 0.34);
    ctx.font = `400 ${subSize}px Pacifico, cursive`;
    ctx.textAlign = align === 'center' ? 'center' : 'left';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.6;
    ctx.fillText(sub, cx, top + blockH + subSize * 0.7);
    ctx.shadowBlur = 0;
  }

  // Small studio mark in the band's corner.
  if (zone.band) {
    ctx.font = `700 ${Math.max(9, H * 0.011)}px system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText('VICE COAST STUDIO', zx + zw - W * 0.02, zy + zh - H * 0.018);
  }
}

/**
 * Draws the whole cover onto a canvas at its own pixel size.
 * state: { layout, grade, title, subtitle, titleSize, ink, outline,
 *          panels: [{photo, zoom, ox, oy}], photos: [HTMLImageElement] }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grade.bg;
  ctx.fillRect(0, 0, W, H);

  // A warm sun glow behind the top of the cover.
  const glow = ctx.createRadialGradient(W * 0.78, H * 0.05, 0, W * 0.78, H * 0.05, W * 0.55);
  glow.addColorStop(0, 'rgba(255, 170, 80, 0.5)');
  glow.addColorStop(0.5, 'rgba(255, 80, 140, 0.18)');
  glow.addColorStop(1, 'rgba(255, 80, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const panels = panelsForLayout(state.layout, W, H);
  const line = Math.max(2, W * 0.004);
  panels.forEach((p, i) => {
    const rect = { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
    const slot = state.panels[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    drawPanelPhoto(ctx, state.photos[slot.photo] ?? null, rect, slot);
    gradePanel(ctx, grade, rect);
    framePanel(ctx, rect, line);
  });

  drawCaption(ctx, state, titleZoneForLayout(state.layout), W, H);

  // Vignette + grain over everything.
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(8, 0, 18, 0)');
  vig.addColorStop(1, 'rgba(8, 0, 18, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  const grain = getGrain(ctx);
  if (grain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

/** Finds which panel (index) a point in cover fractions falls in, or -1. */
export function panelAt(state, fx, fy, W, H) {
  const panels = panelsForLayout(state.layout, W, H);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) return i;
  }
  return -1;
}
