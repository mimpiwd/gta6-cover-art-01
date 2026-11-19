// Photo slots: the user's own photos (read locally, never uploaded) plus the
// bundled samples. Each slot is an HTMLImageElement with a label.
export const SAMPLES = [
  { file: 'boulevard.jpg', label: 'Boulevard sunset' },
  { file: 'neon.jpg', label: 'Neon street' },
  { file: 'rooftop.jpg', label: 'Rooftop dusk' },
];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Loads a bundled sample photo by its file name. */
export function loadSample(file) {
  return loadImage(`samples/${file}`);
}

/** Loads a photo from a File picked on the machine (object URL, local only). */
export function loadFilePhoto(file) {
  return loadImage(URL.createObjectURL(file));
}
