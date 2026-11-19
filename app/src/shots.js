// Fixed scenes for screenshots: ?shot=cover shows the finished cover alone,
// ?shot=editor shows the editor with photos loaded. Query params:
// photo (sample name), photo2, photo3, caption, sub, size, layout, grade, ink.
// window.__shotReady is set once the scene is painted.
import { loadSample } from './photos.js';

export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'boulevard';
  const photo2 = query.get('photo2') ?? 'neon';
  const photo3 = query.get('photo3') ?? 'rooftop';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const sub = query.get('sub') ?? 'Vice Coast';
  const size = query.get('size') ?? 'landscape';
  const layout = query.get('layout') ?? 'hero';
  const grade = query.get('grade') ?? 'sunset';
  const ink = query.get('ink') ?? 'sunset';
  const [a, b, c] = await Promise.all([
    loadSample(`${photo}.jpg`),
    loadSample(`${photo2}.jpg`),
    loadSample(`${photo3}.jpg`),
  ]);
  await apply({
    photos: [a, b, c],
    labels: ['Boulevard sunset', 'Neon street', 'Rooftop dusk'],
    caption,
    sub,
    size,
    layout,
    grade,
    ink,
  });
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
