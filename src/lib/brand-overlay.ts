import type { BrandConfig, BrandOverlay } from "./brands";
import type { TemplateId } from "./types";

type DrawBrandOverlayOpts = {
  brand: BrandConfig | null | undefined;
  templateId: TemplateId;
  width: number;
  height: number;
  overlayEnabled?: boolean;
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
  opts: {
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowBlur?: number;
  } = {},
) {
  const logo = await loadOverlayImage(src);
  const iw = logo.naturalWidth || logo.width;
  const ih = logo.naturalHeight || logo.height;
  const scale = Math.min(maxW / iw, maxH / ih);
  const w = iw * scale;
  const h = ih * scale;

  ctx.save();
  if (opts.shadowColor) {
    ctx.shadowColor = opts.shadowColor;
    ctx.shadowOffsetX = opts.shadowOffsetX ?? 0;
    ctx.shadowOffsetY = opts.shadowOffsetY ?? 0;
    ctx.shadowBlur = opts.shadowBlur ?? 0;
  }
  ctx.drawImage(logo, centerX - w / 2, centerY - h / 2, w, h);
  ctx.restore();
}

async function drawPosterFrame(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const paper = overlay.foregroundColor ?? "#f4f1ea";
  const red = overlay.backgroundColor ?? "#ee0015";
  const inset = canvasW * ((overlay.insetPct ?? 6) / 100);
  const line = Math.max(4, canvasW * ((overlay.borderPct ?? 4) / 100));

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvasW, inset);
  ctx.fillRect(0, 0, inset, canvasH);
  ctx.fillRect(canvasW - inset, 0, inset, canvasH);
  ctx.fillRect(0, canvasH - inset, canvasW, inset);

  ctx.strokeStyle = red;
  ctx.lineWidth = line;
  ctx.strokeRect(
    inset + line / 2,
    inset + line / 2,
    canvasW - inset * 2 - line,
    canvasH - inset * 2 - line,
  );

  const badgeW = canvasW * 0.3;
  const badgeH = canvasH * 0.065;
  const badgeX = canvasW - inset - badgeW;
  const badgeY = canvasH - inset - badgeH;
  ctx.fillStyle = red;
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    badgeX + badgeW / 2,
    badgeY + badgeH / 2,
    canvasW * ((overlay.maxLogoWidthPct ?? 24) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 2.8) / 100),
  );
}

async function drawBracketComposition(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const red = overlay.backgroundColor ?? "#ee0015";
  const inset = canvasW * ((overlay.insetPct ?? 6.5) / 100);
  const line = Math.max(8, canvasW * ((overlay.lineWidthPct ?? 4.2) / 100));
  const bottomY = canvasH - inset - line;

  ctx.fillStyle = red;
  ctx.fillRect(inset, canvasH * 0.2, line, canvasH * 0.72);
  ctx.fillRect(inset, bottomY, canvasW * 0.58, line);

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    inset + canvasW * 0.19,
    bottomY - canvasH * 0.042,
    canvasW * ((overlay.maxLogoWidthPct ?? 26) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 2.9) / 100),
  );
}

async function drawFloatingCaptionBar(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const barH = canvasH * ((overlay.heightPct ?? 13) / 100);
  const centerY = canvasH * ((overlay.yPct ?? 82) / 100);
  const y = centerY - barH / 2;

  ctx.fillStyle = overlay.backgroundColor ?? "#ee0015";
  ctx.globalAlpha = 0.92;
  ctx.fillRect(0, y, canvasW, barH);
  ctx.globalAlpha = 1;

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    centerY,
    canvasW * ((overlay.maxLogoWidthPct ?? 38) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 3.6) / 100),
  );
}

async function drawLogoShadow(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const shadowOffset = canvasW * ((overlay.shadowOffsetPct ?? 1.2) / 100);

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW * ((overlay.xPct ?? 50) / 100),
    canvasH * ((overlay.yPct ?? 91) / 100),
    canvasW * ((overlay.maxLogoWidthPct ?? 42) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 4) / 100),
    {
      shadowColor: overlay.foregroundColor ?? "#ee0015",
      shadowOffsetX: shadowOffset,
      shadowOffsetY: shadowOffset,
    },
  );
}

async function drawGradientFooter(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const footerH = canvasH * ((overlay.heightPct ?? 48) / 100);
  const y = canvasH - footerH;
  const gradient = ctx.createLinearGradient(0, y, 0, canvasH);
  gradient.addColorStop(0, "rgba(238,0,21,0)");
  gradient.addColorStop(0.55, "rgba(238,0,21,0.7)");
  gradient.addColorStop(1, overlay.backgroundColor ?? "#ee0015");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, canvasW, footerH);

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    canvasH - canvasH * 0.09,
    canvasW * ((overlay.maxLogoWidthPct ?? 42) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 3.8) / 100),
  );
}

export async function drawBrandOverlay(
  ctx: CanvasRenderingContext2D,
  opts: DrawBrandOverlayOpts,
) {
  const { brand, templateId, width, height, overlayEnabled } = opts;
  if (!brand || overlayEnabled === false) return;

  for (const overlay of brand.overlays) {
    if (!overlayApplies(overlay, templateId)) continue;

    ctx.save();
    if (overlay.placement === "poster-frame") {
      await drawPosterFrame(ctx, overlay, width, height);
    } else if (overlay.placement === "bracket-composition") {
      await drawBracketComposition(ctx, overlay, width, height);
    } else if (overlay.placement === "floating-caption-bar") {
      await drawFloatingCaptionBar(ctx, overlay, width, height);
    } else if (overlay.placement === "logo-shadow") {
      await drawLogoShadow(ctx, overlay, width, height);
    } else if (overlay.placement === "gradient-footer") {
      await drawGradientFooter(ctx, overlay, width, height);
    }
    ctx.restore();
  }
}
