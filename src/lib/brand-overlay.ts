import type { BrandConfig, BrandOverlay } from "./brands";
import type { TemplateId } from "./types";

type DrawBrandOverlayOpts = {
  brand: BrandConfig | null | undefined;
  templateId: TemplateId;
  width: number;
  height: number;
};

const overlayImageCache = new Map<string, Promise<HTMLImageElement>>();

function loadOverlayImage(src: string): Promise<HTMLImageElement> {
  let pending = overlayImageCache.get(src);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    overlayImageCache.set(src, pending);
  }
  return pending;
}

function overlayApplies(overlay: BrandOverlay, templateId: TemplateId): boolean {
  return !overlay.templateIds || overlay.templateIds.includes(templateId);
}

async function drawContainedLogo(
  ctx: CanvasRenderingContext2D,
  src: string,
  centerX: number,
  centerY: number,
  maxW: number,
  maxH: number,
) {
  const logo = await loadOverlayImage(src);
  const iw = logo.naturalWidth || logo.width;
  const ih = logo.naturalHeight || logo.height;
  const scale = Math.min(maxW / iw, maxH / ih);
  const w = iw * scale;
  const h = ih * scale;
  ctx.drawImage(logo, centerX - w / 2, centerY - h / 2, w, h);
}

async function drawBottomBand(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const bandH = canvasH * ((overlay.heightPct ?? 7.5) / 100);
  const y = canvasH - bandH;
  ctx.fillStyle = overlay.backgroundColor ?? "#000000";
  ctx.fillRect(0, y, canvasW, bandH);
  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    y + bandH / 2,
    canvasW * ((overlay.maxLogoWidthPct ?? 28) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 3.2) / 100),
  );
}

async function drawBottomMark(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const y = canvasH * ((overlay.yPct ?? 94) / 100);
  const ruleW = canvasW * ((overlay.ruleWidthPct ?? 0) / 100);
  const ruleH = Math.max(1, canvasH * ((overlay.ruleHeightPct ?? 0) / 100));

  if (ruleW > 0 && ruleH > 0) {
    ctx.fillStyle = overlay.foregroundColor ?? overlay.backgroundColor ?? "#000000";
    ctx.fillRect((canvasW - ruleW) / 2, y - canvasH * 0.045, ruleW, ruleH);
  }

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    y,
    canvasW * ((overlay.maxLogoWidthPct ?? 24) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 3) / 100),
  );
}

export async function drawBrandOverlay(
  ctx: CanvasRenderingContext2D,
  opts: DrawBrandOverlayOpts,
) {
  const { brand, templateId, width, height } = opts;
  if (!brand) return;

  for (const overlay of brand.overlays) {
    if (!overlayApplies(overlay, templateId)) continue;

    ctx.save();
    if (overlay.placement === "bottom-band") {
      await drawBottomBand(ctx, overlay, width, height);
    } else if (overlay.placement === "bottom-mark") {
      await drawBottomMark(ctx, overlay, width, height);
    }
    ctx.restore();
  }
}
