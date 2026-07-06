let canvasFilterWorks: boolean | null = null;

/** WebKit exposes ctx.filter but ignores it on drawImage; probe once and cache. */
export function supportsCanvasFilter(): boolean {
  if (canvasFilterWorks !== null) return canvasFilterWorks;
  if (typeof document === "undefined") {
    canvasFilterWorks = true;
    return true;
  }

  const size = 8;
  const src = document.createElement("canvas");
  src.width = src.height = size;
  const sctx = src.getContext("2d");
  if (!sctx || !("filter" in sctx)) {
    canvasFilterWorks = false;
    return false;
  }

  sctx.fillStyle = "#ff0000";
  sctx.fillRect(0, 0, size / 2, size);
  sctx.fillStyle = "#0000ff";
  sctx.fillRect(size / 2, 0, size / 2, size);
  const edge = sctx.getImageData(size / 2 - 1, size / 2, 1, 1).data;

  sctx.filter = "blur(3px)";
  sctx.drawImage(src, 0, 0);
  const blurred = sctx.getImageData(size / 2 - 1, size / 2, 1, 1).data;
  canvasFilterWorks = edge[0] !== blurred[0] || edge[2] !== blurred[2];
  return canvasFilterWorks;
}

function blurChannelH(
  src: Uint8ClampedArray,
  dest: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
  ch: number,
) {
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    let count = 0;
    for (let x = 0; x <= r; x++) {
      sum += src[(row + x) * 4 + ch];
      count++;
    }
    for (let x = 0; x < w; x++) {
      dest[(row + x) * 4 + ch] = sum / count;
      if (x + r + 1 < w) {
        sum += src[(row + x + r + 1) * 4 + ch];
        count++;
      }
      if (x - r >= 0) {
        sum -= src[(row + x - r) * 4 + ch];
        count--;
      }
    }
  }
}

function blurChannelV(
  src: Uint8ClampedArray,
  dest: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
  ch: number,
) {
  for (let x = 0; x < w; x++) {
    let sum = 0;
    let count = 0;
    for (let y = 0; y <= r; y++) {
      sum += src[(y * w + x) * 4 + ch];
      count++;
    }
    for (let y = 0; y < h; y++) {
      dest[(y * w + x) * 4 + ch] = sum / count;
      if (y + r + 1 < h) {
        sum += src[((y + r + 1) * w + x) * 4 + ch];
        count++;
      }
      if (y - r >= 0) {
        sum -= src[((y - r) * w + x) * 4 + ch];
        count--;
      }
    }
  }
}

function boxBlurRgb(data: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);
  out.set(data);
  tmp.set(data);
  for (const ch of [0, 1, 2] as const) {
    blurChannelH(data, tmp, w, h, r, ch);
    blurChannelV(tmp, out, w, h, r, ch);
    blurChannelH(out, tmp, w, h, r, ch);
    blurChannelV(tmp, out, w, h, r, ch);
  }
  for (let i = 3; i < out.length; i += 4) out[i] = 255;
  return out;
}

/** In-place box blur for canvas pixels (WebKit fallback when ctx.filter is a no-op). */
export function blurCanvas(canvas: HTMLCanvasElement, radiusPx: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const r = Math.max(1, Math.round(radiusPx));
  const { width: w, height: h } = canvas;
  const src = ctx.getImageData(0, 0, w, h);
  const blurred = boxBlurRgb(src.data, w, h, r);
  ctx.putImageData(new ImageData(new Uint8ClampedArray(blurred), w, h), 0, 0);
}

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  queueMicrotask(() => {
    if (supportsCanvasFilter()) return;
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 16, 32);
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(16, 0, 16, 32);
    blurCanvas(c, 4);
    const mid = ctx.getImageData(15, 16, 1, 1).data;
    if (mid[0] === 255 || mid[2] === 255) {
      throw new Error("canvas-blur self-check: box blur fallback ineffective");
    }
    const solid = document.createElement("canvas");
    solid.width = solid.height = 16;
    const sctx = solid.getContext("2d");
    if (!sctx) return;
    sctx.fillStyle = "#3498db";
    sctx.fillRect(0, 0, 16, 16);
    blurCanvas(solid, 2);
    const center = sctx.getImageData(8, 8, 1, 1).data;
    if (center[0] < 40 || center[2] < 180 || center[3] !== 255) {
      throw new Error("canvas-blur self-check: solid fill corrupted after blur");
    }
  });
}
