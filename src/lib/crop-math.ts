import { CROP_SCALE_MAX, CROP_SCALE_MIN } from "./constants";
import type { PhotoCrop } from "./types";

export function coverScale(frameW: number, frameH: number, imgW: number, imgH: number): number {
  return Math.max(frameW / imgW, frameH / imgH);
}

export function clampCrop(crop: PhotoCrop): PhotoCrop {
  return {
    offsetX: Math.round(Math.max(-200, Math.min(200, crop.offsetX))),
    offsetY: Math.round(Math.max(-200, Math.min(200, crop.offsetY))),
    scale: Math.max(CROP_SCALE_MIN, Math.min(CROP_SCALE_MAX, crop.scale)),
  };
}

/** Same cover math as canvas-render drawCover (export frame size). */
export function cropAfterPan(
  crop: PhotoCrop,
  deltaX: number,
  deltaY: number,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number,
): PhotoCrop {
  const eff = coverScale(frameW, frameH, imgW, imgH) * crop.scale;
  return clampCrop({
    ...crop,
    offsetX: crop.offsetX + deltaX * eff,
    offsetY: crop.offsetY + deltaY * eff,
  });
}

export function cropAfterZoom(
  crop: PhotoCrop,
  factor: number,
  _frameW: number,
  _frameH: number,
  _imgW: number,
  _imgH: number,
): PhotoCrop {
  return clampCrop({
    ...crop,
    scale: crop.scale * factor,
  });
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: PhotoCrop,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const eff = coverScale(dw, dh, iw, ih) * crop.scale;
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
