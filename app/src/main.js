// Wires the editor: photos, layouts, grades, caption, sizes and export.
// The preview canvas and the exported PNG are the same drawing (cover.js),
// so what you see is what the PNG holds.
import { drawCover, panelAt } from './cover.js';
import { LAYOUTS, panelCount, panelsForLayout } from './layouts.js';
import { GRADES, SIZES, INKS } from './grades.js';
import { SAMPLES, loadSample, loadFilePhoto } from './photos.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'landscape',
  title: 'Sunset Heist',
  subtitle: 'Vice Coast',
  titleSize: 1,
  ink: 'sunset',
  outline: true,
  panels: [
    { photo: 0, zoom: 1.05, ox: 0, oy: 0 },
    { photo: 1, zoom: 1.1, ox: 0, oy: 0 },
    { photo: 2, zoom: 1.1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
  ],
  photos: [],
  labels: [],
};

let selectedPanel = 0;
let shotCover = false;

function setStatus(msg) {
  statusEl.textContent = msg;
}

/** Makes sure state.panels matches the current layout's panel count. */
export function syncPanels() {
  const n = panelCount(state.layout);
  while (state.panels.length < n) {
    state.panels.push({ photo: state.panels.length % Math.max(1, state.photos.length), zoom: 1.1, ox: 0, oy: 0 });
  }
  state.panels.length = n;
}

/** Sizes the preview canvas for the chosen export size and redraws. */
export function resizePreview() {
  const size = SIZES[state.size];
  if (shotCover) {
    canvas.width = size.w;
    canvas.height = size.h;
  } else {
    const scale = Math.min(1, 920 / Math.max(size.w, size.h));
    canvas.width = Math.round(size.w * scale);
    canvas.height = Math.round(size.h * scale);
  }
  canvas.style.aspectRatio = `${size.w} / ${size.h}`;
  redraw();
}

export function redraw() {
  drawCover(canvas, state);
  syncPanelControls();
}

/** Refreshes the selected-panel controls (zoom slider, photo picker). */
function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  document.getElementById('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${state.panels.length}`;
  const zoom = document.getElementById('zoom');
  zoom.value = String(panel.zoom);
  document.getElementById('zoomValue').textContent = `${Math.round(panel.zoom * 100)}%`;
  const picker = document.getElementById('panelPhoto');
  picker.innerHTML = '';
  state.labels.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Photo ${i + 1} — ${label}`;
    picker.appendChild(opt);
  });
  picker.value = String(panel.photo);
  document.querySelectorAll('#thumbs button').forEach((b, i) => {
    b.classList.toggle('active', panel.photo === i);
  });
}

/** Rebuilds the photo thumbnail strip from the loaded slots. */
function syncThumbs() {
  const strip = document.getElementById('thumbs');
  strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = state.labels[i] ?? `Photo ${i + 1}`;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = b.title;
    b.appendChild(thumb);
    b.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      redraw();
      setStatus(`Panel ${selectedPanel + 1} now uses ${b.title}.`);
    });
    strip.appendChild(b);
  });
  syncPanelControls();
}

/** Adds a loaded photo as a new slot. */
export function addPhoto(img, label) {
  state.photos.push(img);
  state.labels.push(label);
  syncThumbs();
  redraw();
}

/** Builds the layout / grade / size picker buttons from the definitions. */
function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.value = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.layout = key;
      syncPanels();
      document.querySelectorAll('#layouts .pick').forEach((x) => x.classList.toggle('active', x === b));
      resizePreview();
      setStatus(`${def.label} layout. Click a panel to move its photo.`);
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = document.getElementById('grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick swatch';
    b.dataset.value = key;
    b.style.background = `linear-gradient(135deg, ${def.band[0]}, ${def.band[1]} 55%, ${def.band[2]})`;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.grade = key;
      document.querySelectorAll('#grades .pick').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
    gradeBox.appendChild(b);
  });
  const sizeBox = document.getElementById('sizes');
  Object.entries(SIZES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.value = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.size = key;
      document.querySelectorAll('#sizes .pick').forEach((x) => x.classList.toggle('active', x === b));
      resizePreview();
    });
    sizeBox.appendChild(b);
  });
  const inkSel = document.getElementById('ink');
  Object.entries(INKS).forEach(([key, def]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = def.label;
    inkSel.appendChild(opt);
  });
  document.querySelectorAll('#layouts .pick')[0]?.classList.add('active');
  document.querySelectorAll('#grades .pick')[0]?.classList.add('active');
  document.querySelectorAll('#sizes .pick')[2]?.classList.add('active');
}

/** Exports the cover at the chosen size as a PNG download. */
export function exportCover() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — please try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    window.__exported = { w: size.w, h: size.h, bytes: blob.size };
    setStatus(`Saved vice-coast-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KB).`);
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  }, 'image/png');
}

/** Panel picking and dragging on the preview canvas. */
function wireCanvas() {
  let drag = null;
  const toFractions = (e) => {
    const r = canvas.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const { fx, fy } = toFractions(e);
    const hit = panelAt(state, fx, fy, canvas.width, canvas.height);
    if (hit === -1) return;
    selectedPanel = hit;
    drag = { x: e.clientX, y: e.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const panel = state.panels[selectedPanel];
    const rect = panelsForLayout(state.layout, canvas.width, canvas.height)[selectedPanel];
    const pw = rect.w * r.width;
    const ph = rect.h * r.height;
    panel.ox = clamp(drag.ox + (e.clientX - drag.x) / pw, -0.6, 0.6);
    panel.oy = clamp(drag.oy + (e.clientY - drag.y) / ph, -0.6, 0.6);
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selectedPanel];
    panel.zoom = clamp(panel.zoom * (1 - e.deltaY * 0.001), 1, 3);
    redraw();
  }, { passive: false });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Wires every control in the sidebar. */
function wireControls() {
  document.getElementById('upload').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      try {
        addPhoto(await loadFilePhoto(file), file.name.replace(/\.[^.]+$/, ''));
        setStatus(`Loaded ${file.name} — it stays on your machine.`);
      } catch {
        setStatus(`Could not read ${file.name}.`);
      }
    }
    e.target.value = '';
  });
  document.getElementById('panelPhoto').addEventListener('change', (e) => {
    state.panels[selectedPanel].photo = Number(e.target.value);
    redraw();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('resetCrop').addEventListener('click', () => {
    state.panels[selectedPanel].zoom = 1.1;
    state.panels[selectedPanel].ox = 0;
    state.panels[selectedPanel].oy = 0;
    redraw();
  });
  document.getElementById('fillAll').addEventListener('click', () => {
    const photo = state.panels[selectedPanel].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    redraw();
    setStatus('Every panel now uses that photo.');
  });
  document.getElementById('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    redraw();
  });
  document.getElementById('ink').addEventListener('change', (e) => {
    state.ink = e.target.value;
    redraw();
  });
  document.getElementById('outline').addEventListener('change', (e) => {
    state.outline = e.target.checked;
    redraw();
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    syncPanels();
    state.panels.forEach((p) => {
      p.photo = Math.floor(Math.random() * state.photos.length);
      p.zoom = 1.05 + Math.random() * 0.3;
    });
    document.querySelectorAll('#layouts .pick').forEach((x) => x.classList.toggle('active', x.dataset.value === state.layout));
    document.querySelectorAll('#grades .pick').forEach((x) => x.classList.toggle('active', x.dataset.value === state.grade));
    resizePreview();
    setStatus('Shuffled layout, grade and photos.');
  });
  document.getElementById('export').addEventListener('click', exportCover);
}

buildPickers();
wireControls();
wireCanvas();

/** Loads the bundled samples, then draws. */
async function boot() {
  try {
    await document.fonts.load('400 40px Anton');
    await document.fonts.load('400 40px Pacifico');
  } catch { /* fall back to system fonts */ }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    shotCover = shot === 'cover';
    await runShot(shot, params, async (scene) => {
      state.photos = scene.photos;
      state.labels = scene.labels;
      state.title = scene.caption;
      state.subtitle = scene.sub;
      state.size = SIZES[scene.size] ? scene.size : 'landscape';
      state.layout = LAYOUTS[scene.layout] ? scene.layout : 'hero';
      state.grade = GRADES[scene.grade] ? scene.grade : 'sunset';
      state.ink = INKS[scene.ink] ? scene.ink : 'sunset';
      syncPanels();
      state.panels[0].photo = 0;
      if (state.panels[1]) state.panels[1].photo = 1;
      if (state.panels[2]) state.panels[2].photo = 2;
      if (state.panels[3]) state.panels[3].photo = 0;
      document.getElementById('title').value = state.title;
      document.getElementById('subtitle').value = state.subtitle;
      document.getElementById('ink').value = state.ink;
      document.querySelectorAll('#layouts .pick').forEach((x) => x.classList.toggle('active', x.dataset.value === state.layout));
      document.querySelectorAll('#grades .pick').forEach((x) => x.classList.toggle('active', x.dataset.value === state.grade));
      document.querySelectorAll('#sizes .pick').forEach((x) => x.classList.toggle('active', x.dataset.value === state.size));
      syncThumbs();
      resizePreview();
    });
    return;
  }
  for (const sample of SAMPLES) {
    try {
      addPhoto(await loadSample(sample.file), sample.label);
    } catch { /* a missing sample just leaves an empty slot */ }
  }
  resizePreview();
  setStatus('Pick a panel, drag its photo, then Export PNG.');
}

boot();
