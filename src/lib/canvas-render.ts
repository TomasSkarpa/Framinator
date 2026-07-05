import {
  exportHeight,
  EXPORT_WIDTH,
  PREVIEW_DISPLAY_WIDTH,
  PREVIEW_JPEG_QUALITY,
  PREVIEW_MAX_DPR,
  type AspectRatio,
} from "./constants";
import { loadLut, applyLutToCanvas, type Lut3D } from "./lut";
import type { FilterPreset, PhotoItem, Slide, TemplateId } from "./types";

type RenderOpts = {
  width?: number;
  height?: number;
  filter: FilterPreset;
  borderWidth: number;
  templateId: TemplateId;
  aspectRatio: AspectRatio;
  /** Kodak strip: decorative frame counter (0-based slide index). */
  slideIndex?: number;
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

const KODAK_CREAM = "#f3f0e9";
const KODAK_INK = "#181614";
const KODAK_GOLD = "#c4a55c";
const KODAK_HOLE = "#3c3a37";
const KODAK_FRAME_ASPECT = 640 / 900;

function drawPaperBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = KODAK_CREAM;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#beb9af";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 16) {
    const tickH = (x / 16) % 5 === 0 ? 10 : 5;
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.lineTo(x, 4 + tickH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, h - 4);
    ctx.lineTo(x, h - 4 - tickH);
    ctx.stroke();
  }
}

function kodakFrameLayout(w: number, h: number) {
  const maxFrameH = h * 0.82;
  const maxFrameW = w * 0.72;
  let frameH = maxFrameH;
  let frameW = frameH * KODAK_FRAME_ASPECT;
  if (frameW > maxFrameW) {
    frameW = maxFrameW;
    frameH = frameW / KODAK_FRAME_ASPECT;
  }
  return {
    x: (w - frameW) / 2,
    y: h * 0.06,
    w: frameW,
    h: frameH,
    border: Math.max(12, Math.round(frameW * (22 / 640))),
    labelW: Math.max(18, Math.round(frameW * (30 / 640))),
    sprocketPad: Math.max(6, Math.round(frameH * (9 / 900))),
  };
}

function drawSprocketHoles(
  ctx: CanvasRenderingContext2D,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number,
) {
  const holeW = Math.max(8, frameW * (14 / 640));
  const holeH = Math.max(5, frameH * (8 / 900));
  const gap = Math.max(6, frameW * (10 / 640));
  const pitch = holeW + gap;
  const count = Math.max(3, Math.floor((frameW - 28) / pitch));
  const startX = frameX + (frameW - count * pitch + gap) / 2;
  const topY = frameY + 6;
  const bottomY = frameY + frameH - 6 - holeH;
  ctx.fillStyle = KODAK_HOLE;
  for (let i = 0; i < count; i++) {
    const x = startX + i * pitch;
    ctx.beginPath();
    ctx.roundRect(x, topY, holeW, holeH, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x, bottomY, holeW, holeH, 2);
    ctx.fill();
  }
}

function drawKodakMarkings(
  ctx: CanvasRenderingContext2D,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number,
  border: number,
  labelW: number,
  frameNo: number,
) {
  const fontSize = Math.max(9, Math.round(frameW * (13 / 640)));
  const tinySize = Math.max(7, Math.round(frameW * (10 / 640)));
  const noSize = Math.max(9, Math.round(frameW * (13 / 640)));
  ctx.fillStyle = KODAK_GOLD;
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;

  ctx.save();
  ctx.translate(frameX + labelW * 0.2, frameY + frameH * 0.58);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("KODAK PORTRA 400", 0, 0);
  ctx.restore();

  const triX = frameX + frameW - border - 18;
  const triY = frameY + border;
  ctx.beginPath();
  ctx.moveTo(triX, triY);
  ctx.lineTo(triX + 10, triY);
  ctx.lineTo(triX + 5, triY + 9);
  ctx.closePath();
  ctx.fill();

  ctx.font = `bold ${tinySize}px system-ui, sans-serif`;
  ctx.fillText("400", triX - 20, triY + tinySize);

  ctx.fillStyle = "#d2cdc3";
  ctx.font = `bold ${noSize}px system-ui, sans-serif`;
  ctx.fillText(
    String(40 + frameNo),
    frameX + border + labelW * 0.35,
    frameY + frameH - border,
  );
  ctx.fillText(
    String(6 + frameNo),
    frameX + frameW - border - noSize,
    frameY + frameH - border,
  );
}

async function drawKodakStrip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
  crop: PhotoItem["crop"],
  lut: Lut3D | null,
  frameNo: number,
) {
  drawPaperBackground(ctx, w, h);
  const layout = kodakFrameLayout(w, h);
  const { x: frameX, y: frameY, w: frameW, h: frameH, border, labelW, sprocketPad } = layout;

  ctx.fillStyle = KODAK_INK;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  drawSprocketHoles(ctx, frameX, frameY, frameW, frameH);

  const innerX = frameX + border + labelW;
  const innerY = frameY + border + sprocketPad;
  const innerW = frameW - border * 2 - labelW;
  const innerH = frameH - border * 2 - sprocketPad * 2;
  await drawCoverWithLut(ctx, img, crop, innerX, innerY, innerW, innerH, lut);
  drawKodakMarkings(ctx, frameX, frameY, frameW, frameH, border, labelW, frameNo);
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

  if (opts.templateId === "framed-polaroid") {
    const frame = drawPolaroidFrame(ctx, w, h, opts.borderWidth);
    await drawCoverWithLut(ctx, img, photo.crop, frame.x, frame.y, frame.w, frame.h, lut);
  } else if (opts.templateId === "kodak-strip") {
    await drawKodakStrip(ctx, w, h, img, photo.crop, lut, opts.slideIndex ?? 0);
  } else {
    await drawCoverWithLut(ctx, img, photo.crop, 0, 0, w, h, lut);
  }

  return canvas;
}

function previewWidth(): number {
  const dpr =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, PREVIEW_MAX_DPR)
      : 1;
  return Math.min(EXPORT_WIDTH, Math.round(PREVIEW_DISPLAY_WIDTH * dpr));
}

export async function renderSlidePreviewDataUrl(
  slide: Slide,
  photosById: Map<string, PhotoItem>,
  opts: RenderOpts,
): Promise<string> {
  const w = previewWidth();
  const canvas = await renderSlideToCanvas(slide, photosById, {
    ...opts,
    width: w,
    height: Math.round(w * (exportHeight(opts.aspectRatio) / EXPORT_WIDTH)),
  });
  return canvas.toDataURL("image/jpeg", PREVIEW_JPEG_QUALITY);
}
