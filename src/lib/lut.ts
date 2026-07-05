import { cubeUrl, normalizeFilter } from "./filters";
import type { FilterPreset } from "./types";

export type Lut3D = {
  size: number;
  data: Float32Array;
};

const cache = new Map<FilterPreset, Lut3D | null>();

export function parseCube(text: string): Lut3D {
  let size = 0;
  const values: number[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      const match = trimmed.match(/LUT_3D_SIZE\s+(\d+)/);
      if (match) size = Number.parseInt(match[1], 10);
      continue;
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    const r = Number.parseFloat(parts[0]);
    const g = Number.parseFloat(parts[1]);
    const b = Number.parseFloat(parts[2]);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) continue;
    values.push(r, g, b);
  }

  if (!size) throw new Error("Invalid cube: missing LUT_3D_SIZE");
  const expected = size * size * size * 3;
  if (values.length !== expected) {
    throw new Error(`Invalid cube: expected ${expected} values, got ${values.length}`);
  }

  return { size, data: Float32Array.from(values) };
}

function sample(lut: Lut3D, x: number, y: number, z: number): [number, number, number] {
  const { size, data } = lut;
  const idx = (z * size * size + y * size + x) * 3;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleTrilinear(lut: Lut3D, r: number, g: number, b: number): [number, number, number] {
  const max = lut.size - 1;
  const rf = Math.min(Math.max(r * max, 0), max);
  const gf = Math.min(Math.max(g * max, 0), max);
  const bf = Math.min(Math.max(b * max, 0), max);

  const x0 = Math.floor(rf);
  const y0 = Math.floor(gf);
  const z0 = Math.floor(bf);
  const x1 = Math.min(x0 + 1, max);
  const y1 = Math.min(y0 + 1, max);
  const z1 = Math.min(z0 + 1, max);
  const tx = rf - x0;
  const ty = gf - y0;
  const tz = bf - z0;

  const c000 = sample(lut, x0, y0, z0);
  const c100 = sample(lut, x1, y0, z0);
  const c010 = sample(lut, x0, y1, z0);
  const c110 = sample(lut, x1, y1, z0);
  const c001 = sample(lut, x0, y0, z1);
  const c101 = sample(lut, x1, y0, z1);
  const c011 = sample(lut, x0, y1, z1);
  const c111 = sample(lut, x1, y1, z1);

  const out: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const x00 = lerp(c000[i], c100[i], tx);
    const x10 = lerp(c010[i], c110[i], tx);
    const x01 = lerp(c001[i], c101[i], tx);
    const x11 = lerp(c011[i], c111[i], tx);
    const y0v = lerp(x00, x10, ty);
    const y1v = lerp(x01, x11, ty);
    out[i] = Math.min(Math.max(lerp(y0v, y1v, tz), 0), 1);
  }
  return out;
}

export function applyLutToCanvas(canvas: HTMLCanvasElement, lut: Lut3D): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const [nr, ng, nb] = sampleTrilinear(lut, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
    d[i] = Math.round(nr * 255);
    d[i + 1] = Math.round(ng * 255);
    d[i + 2] = Math.round(nb * 255);
  }
  ctx.putImageData(imageData, 0, 0);
}

export async function loadLut(filter: FilterPreset): Promise<Lut3D | null> {
  const key = normalizeFilter(filter);
  if (key === "none") return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const url = cubeUrl(key);
  if (!url) {
    cache.set(key, null);
    return null;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load LUT: ${url}`);
  const lut = parseCube(await res.text());
  cache.set(key, lut);
  return lut;
}

export function preloadLuts(): void {
  for (const id of ["astia", "velvia", "fp100c", "elite-chrome", "xpro", "superia"] as FilterPreset[]) {
    void loadLut(id);
  }
}
