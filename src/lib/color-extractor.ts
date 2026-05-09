/**
 * Client-side dominant-color extraction for uploaded logos.
 * Loads the image into an offscreen canvas, samples pixels, runs a quick
 * k-means (k=3) on quantized colors, and returns the top three sorted by
 * vibrancy. Designed to work for PNG, JPG and SVG inputs.
 */

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
}

const SAMPLE_SIZE = 96; // Downscale before sampling - much faster, still accurate.
const K = 3;
const MAX_ITERATIONS = 8;

interface RGB { r: number; g: number; b: number }

export async function extractColors(file: File): Promise<ExtractedColors> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  const aspect = img.width / Math.max(img.height, 1);
  const w = aspect >= 1 ? SAMPLE_SIZE : Math.max(8, Math.round(SAMPLE_SIZE * aspect));
  const h = aspect >= 1 ? Math.max(8, Math.round(SAMPLE_SIZE / aspect)) : SAMPLE_SIZE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const samples: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent
    if (isNearWhite(r, g, b) || isNearBlack(r, g, b) || isNearGray(r, g, b)) continue;
    samples.push({ r, g, b });
  }

  if (samples.length < K) {
    return {
      primary: "#00B3B3",
      secondary: "#0E1420",
      accent: "#6366F1",
    };
  }

  // Run k-means with k=5 - we'll diversify down to 3 distinct colors. More
  // initial clusters means we recover from collapses caused by a near-monochrome
  // logo without producing duplicates.
  const clusters = kmeans(samples, 5, MAX_ITERATIONS);
  const distinct = diversify(clusters, 28);

  // Sort by saturation desc so the most vibrant colour ends up as the accent.
  // Primary/secondary are positions 0-1 (the dominant cluster colours), accent
  // is the standout - call it out separately so users see a true "highlight".
  const sortedBySaturation = [...distinct].sort((a, b) => saturation(b) - saturation(a));
  const accent = sortedBySaturation[0];
  const remaining = distinct.filter((c) => c !== accent);
  const sortedByDarkness = remaining.sort((a, b) => brightness(a) - brightness(b));

  return {
    primary: rgbToHex(sortedByDarkness[0] ?? distinct[0]),
    secondary: rgbToHex(sortedByDarkness[1] ?? distinct[1] ?? distinct[0]),
    accent: rgbToHex(accent),
  };
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
function brightness({ r, g, b }: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b; // luminance
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

function isNearWhite(r: number, g: number, b: number): boolean {
  return r > 240 && g > 240 && b > 240;
}
function isNearBlack(r: number, g: number, b: number): boolean {
  return r < 18 && g < 18 && b < 18;
}
function isNearGray(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 16; // very low saturation
}

function distSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * k-means++ initialization: pick first centroid randomly, each subsequent
 * centroid weighted by its squared distance to the nearest existing centroid.
 * Guarantees diverse starting points so the algorithm doesn't collapse to
 * three near-identical colors when the input is dominated by one hue.
 */
function kmeansPlusPlusInit(samples: RGB[], k: number): RGB[] {
  const centroids: RGB[] = [samples[Math.floor(Math.random() * samples.length)]];
  while (centroids.length < k) {
    let total = 0;
    const distances = samples.map((s) => {
      let min = Infinity;
      for (const c of centroids) {
        const d = distSq(s, c);
        if (d < min) min = d;
      }
      total += min;
      return min;
    });
    if (total === 0) {
      // All remaining samples coincide with existing centroids - bail with a
      // perturbed copy of the last centroid so we still return k entries.
      const last = centroids[centroids.length - 1];
      centroids.push({
        r: clamp(last.r + 32),
        g: clamp(last.g - 16),
        b: clamp(last.b + 24),
      });
      continue;
    }
    let target = Math.random() * total;
    let chosen = samples[samples.length - 1];
    for (let i = 0; i < samples.length; i++) {
      target -= distances[i];
      if (target <= 0) { chosen = samples[i]; break; }
    }
    centroids.push(chosen);
  }
  return centroids;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function kmeans(samples: RGB[], k: number, maxIter: number): RGB[] {
  let centroids = kmeansPlusPlusInit(samples, k);

  for (let iter = 0; iter < maxIter; iter++) {
    const buckets: RGB[][] = Array.from({ length: k }, () => []);
    for (const s of samples) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < k; i++) {
        const d = distSq(s, centroids[i]);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      buckets[best].push(s);
    }

    const next = centroids.map((c, i) => {
      const bucket = buckets[i];
      if (bucket.length === 0) return c;
      const avg = bucket.reduce(
        (acc, s) => ({ r: acc.r + s.r, g: acc.g + s.g, b: acc.b + s.b }),
        { r: 0, g: 0, b: 0 }
      );
      return {
        r: Math.round(avg.r / bucket.length),
        g: Math.round(avg.g / bucket.length),
        b: Math.round(avg.b / bucket.length),
      };
    });

    const moved = next.some((c, i) => distSq(c, centroids[i]) > 4);
    centroids = next;
    if (!moved) break;
  }

  return centroids;
}

/**
 * Reject duplicates from the centroid set. Centroids closer than `minDist`
 * (Euclidean RGB) are considered the same; missing slots are filled with
 * theme-shifted variants of the dominant color so callers always receive
 * three distinct results.
 */
function diversify(centroids: RGB[], minDist: number): RGB[] {
  const unique: RGB[] = [];
  for (const c of centroids) {
    const conflict = unique.some((u) => distSq(c, u) < minDist * minDist);
    if (!conflict) unique.push(c);
  }
  while (unique.length < 3) {
    const base = unique[0] ?? { r: 100, g: 100, b: 200 };
    const shift = unique.length;
    unique.push({
      r: clamp(base.r + (shift === 1 ? -64 : 48)),
      g: clamp(base.g + (shift === 1 ? 32 : -48)),
      b: clamp(base.b + (shift === 1 ? -48 : 64)),
    });
  }
  return unique.slice(0, 3);
}

function vibrancy({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const lightness = (max + min) / 510; // 0..1
  // Penalise extremes (too dark or too light) - prefer mid-tone vibrant colours.
  const lightnessScore = 1 - Math.abs(lightness - 0.5) * 1.5;
  return saturation * 0.7 + lightnessScore * 0.3;
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
