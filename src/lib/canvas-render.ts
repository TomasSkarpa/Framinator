import { exportHeight, EXPORT_WIDTH, type AspectRatio } from "./constants";
import { loadLut, applyLutToCanvas, type Lut3D } from "./lut";
import type { FilterPreset, PhotoItem, Slide, TemplateId } from "./types";

type RenderOpts = {
  width?: number;
  height?: number;
  filter: FilterPreset;
  borderWidth: number;
  templateId: TemplateId;
  aspectRatio: AspectRatio;
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  let pending = imageCache.get(src);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, pending);
  }
  return pending;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: PhotoItem["crop"],
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const coverScale = Math.max(dw / iw, dh / ih);
  const eff = coverScale * crop.scale;
  const sw = dw / eff;
  const sh = dh / eff;

  if (sw >= iw && sh >= ih) {
    const fit = Math.min(dw / iw, dh / ih);
    const w = iw * fit;
    const h = ih * fit;
    ctx.drawImage(img, 0, 0, iw, ih, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
    return;
  }

  const sx = (iw - sw) / 2 - crop.offsetX / eff;
  const sy = (ih - sh) / 2 - crop.offsetY / eff;
  const x0 = Math.max(0, sx);
  const y0 = Math.max(0, sy);
  const x1 = Math.min(iw, sx + sw);
  const y1 = Math.min(ih, sy + sh);
  const csw = x1 - x0;
  const csh = y1 - y0;
  if (csw <= 0 || csh <= 0) return;

  ctx.drawImage(
    img,
    x0,
    y0,
    csw,
    csh,
    dx + ((x0 - sx) / sw) * dw,
    dy + ((y0 - sy) / sh) * dh,
    (csw / sw) * dw,
    (csh / sh) * dh,
  );
}

async function drawCoverWithLut(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: PhotoItem["crop"],
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  lut: Lut3D | null,
) {
  if (!lut) {
    drawCover(ctx, img, crop, dx, dy, dw, dh);
    return;
  }

  const tmp = document.createElement("canvas");
  tmp.width = Math.max(1, Math.round(dw));
  tmp.height = Math.max(1, Math.round(dh));
  const tctx = tmp.getContext("2d");
  if (!tctx) {
    drawCover(ctx, img, crop, dx, dy, dw, dh);
    return;
  }
  drawCover(tctx, img, crop, 0, 0, tmp.width, tmp.height);
  applyLutToCanvas(tmp, lut);
  ctx.drawImage(tmp, dx, dy, dw, dh);
}

function drawPolaroidFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  border: number,
) {
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, w, h);
  const pad = border * 3;
  const bottomExtra = border * 5;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(pad, pad, w - pad * 2, h - pad - bottomExtra);
  return { x: pad, y: pad, w: w - pad * 2, h: h - pad - bottomExtra };
}

function drawStoryArcFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  variant: "cover" | "full" | "inset" | undefined,
  border: number,
) {
  if (variant === "cover") {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, w, h);
    const barH = h * 0.22;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, h - barH, w, barH);
    return { x: 0, y: 0, w, h: h - barH * 0.3 };
  }
  if (variant === "inset") {
    const m = border * 4 + 24;
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, w, h);
    return { x: m, y: m, w: w - m * 2, h: h - m * 2 };
  }
  return { x: 0, y: 0, w, h };
}

export async function renderSlideToCanvas(
  slide: Slide,
  photosById: Map<string, PhotoItem>,
  opts: RenderOpts,
): Promise<HTMLCanvasElement> {
  const w = opts.width ?? EXPORT_WIDTH;
  const h = opts.height ?? exportHeight(opts.aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const cell = slide.cells[0];
  if (!cell) return canvas;

  const photo = photosById.get(cell.photoId);
  if (!photo) return canvas;

  const img = await loadImage(photo.objectUrl);
  const lut = await loadLut(opts.filter);

  if (opts.templateId === "grid-split" && cell.gridColumn !== undefined) {
    const col = cell.gridColumn;
    const sliceW = w;
    const fullW = w * 3;
    const sliceX = col * w;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    await drawCoverWithLut(ctx, img, photo.crop, -sliceX, 0, fullW, h, lut);
    ctx.restore();
  } else if (opts.templateId === "framed-polaroid") {
    const frame = drawPolaroidFrame(ctx, w, h, opts.borderWidth);
    await drawCoverWithLut(ctx, img, photo.crop, frame.x, frame.y, frame.w, frame.h, lut);
  } else if (opts.templateId === "story-arc") {
    const frame = drawStoryArcFrame(ctx, w, h, cell.variant, opts.borderWidth);
    await drawCoverWithLut(ctx, img, photo.crop, frame.x, frame.y, frame.w, frame.h, lut);
  } else {
    await drawCoverWithLut(ctx, img, photo.crop, 0, 0, w, h, lut);
  }

  return canvas;
}

export async function renderSlidePreviewDataUrl(
  slide: Slide,
  photosById: Map<string, PhotoItem>,
  opts: RenderOpts,
): Promise<string> {
  const canvas = await renderSlideToCanvas(slide, photosById, {
    ...opts,
    width: 360,
    height: Math.round(360 * (exportHeight(opts.aspectRatio) / EXPORT_WIDTH)),
  });
  return canvas.toDataURL("image/jpeg", 0.82);
}
