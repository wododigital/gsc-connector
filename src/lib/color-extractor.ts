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

  const clusters = kmeans(samples, K, MAX_ITERATIONS);
  const ranked = clusters.sort((a, b) => vibrancy(b) - vibrancy(a));

  return {
    primary: rgbToHex(ranked[0]),
    secondary: rgbToHex(ranked[1] ?? ranked[0]),
    accent: rgbToHex(ranked[2] ?? ranked[1] ?? ranked[0]),
  };
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

function kmeans(samples: RGB[], k: number, maxIter: number): RGB[] {
  // Initialize centroids by picking k spaced samples.
  const stride = Math.floor(samples.length / k) || 1;
  let centroids: RGB[] = Array.from({ length: k }, (_, i) => samples[i * stride] ?? samples[0]);

  for (let iter = 0; iter < maxIter; iter++) {
    const buckets: RGB[][] = Array.from({ length: k }, () => []);
    for (const s of samples) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < k; i++) {
        const c = centroids[i];
        const dr = s.r - c.r;
        const dg = s.g - c.g;
        const db = s.b - c.b;
        const d = dr * dr + dg * dg + db * db;
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

    const moved = next.some((c, i) => {
      const dr = c.r - centroids[i].r;
      const dg = c.g - centroids[i].g;
      const db = c.b - centroids[i].b;
      return dr * dr + dg * dg + db * db > 4;
    });
    centroids = next;
    if (!moved) break;
  }

  return centroids;
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
