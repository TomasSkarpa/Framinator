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

function boxBlurH(
  src: Uint8ClampedArray,
  dest: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
) {
  const div = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let as = 0;
    for (let x = 0; x <= r; x++) {
      const p = (row + x) * 4;
      rs += src[p];
      gs += src[p + 1];
      bs += src[p + 2];
      as += src[p + 3];
    }
    for (let x = 0; x < w; x++) {
      const p = (row + x) * 4;
      dest[p] = rs / div;
      dest[p + 1] = gs / div;
      dest[p + 2] = bs / div;
      dest[p + 3] = as / div;
      const add = Math.min(x + r + 1, w - 1);
      const sub = Math.max(x - r, 0);
      const pa = (row + add) * 4;
      const ps = (row + sub) * 4;
      rs += src[pa] - src[ps];
      gs += src[pa + 1] - src[ps + 1];
      bs += src[pa + 2] - src[ps + 2];
      as += src[pa + 3] - src[ps + 3];
    }
  }
}

function boxBlurV(
  src: Uint8ClampedArray,
  dest: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
) {
  const div = 2 * r + 1;
  for (let x = 0; x < w; x++) {
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let as = 0;
    for (let y = 0; y <= r; y++) {
      const p = (y * w + x) * 4;
      rs += src[p];
      gs += src[p + 1];
      bs += src[p + 2];
      as += src[p + 3];
    }
    for (let y = 0; y < h; y++) {
      const p = (y * w + x) * 4;
      dest[p] = rs / div;
      dest[p + 1] = gs / div;
      dest[p + 2] = bs / div;
      dest[p + 3] = as / div;
      const add = Math.min(y + r + 1, h - 1);
      const sub = Math.max(y - r, 0);
      const pa = (add * w + x) * 4;
      const ps = (sub * w + x) * 4;
      rs += src[pa] - src[ps];
      gs += src[pa + 1] - src[ps + 1];
      bs += src[pa + 2] - src[ps + 2];
      as += src[pa + 3] - src[ps + 3];
    }
  }
}

function boxBlurRgba(data: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);
  // ponytail: 2-pass box blur, O(w*h*r); upgrade path: ctx.filter when WebKit honors it
  boxBlurH(data, tmp, w, h, r);
  boxBlurV(tmp, out, w, h, r);
  boxBlurH(out, tmp, w, h, r);
  boxBlurV(tmp, out, w, h, r);
  return out;
}

/** In-place box blur for canvas pixels (WebKit fallback when ctx.filter is a no-op). */
export function blurCanvas(canvas: HTMLCanvasElement, radiusPx: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const r = Math.max(1, Math.round(radiusPx));
  const { width: w, height: h } = canvas;
  const src = ctx.getImageData(0, 0, w, h);
  const blurred = boxBlurRgba(src.data, w, h, r);
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
  });
}
