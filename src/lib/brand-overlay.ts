import type { BrandConfig, BrandOverlay } from "./brands";
import type { TemplateId } from "./types";

type DrawBrandOverlayOpts = {
  brand: BrandConfig | null | undefined;
  templateId: TemplateId;
  width: number;
  height: number;
  borderWidth: number;
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
    opacity?: number;
    rotationDeg?: number;
    blendMode?: GlobalCompositeOperation;
  } = {},
) {
  const logo = await loadOverlayImage(src);
  const iw = logo.naturalWidth || logo.width;
  const ih = logo.naturalHeight || logo.height;
  const scale = Math.min(maxW / iw, maxH / ih);
  const w = iw * scale;
  const h = ih * scale;

  ctx.save();
  ctx.globalAlpha = opts.opacity ?? 1;
  ctx.globalCompositeOperation = opts.blendMode ?? "source-over";
  ctx.translate(centerX, centerY);
  if (opts.rotationDeg) ctx.rotate((opts.rotationDeg * Math.PI) / 180);
  ctx.drawImage(logo, -w / 2, -h / 2, w, h);
  ctx.restore();
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

async function drawPolaroidFrameOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
  borderWidth: number,
) {
  const border = overlay.backgroundColor ?? "#000000";
  const pad = borderWidth * 3;
  const bottomExtra = borderWidth * 5;
  const innerX = pad;
  const innerY = pad;
  const innerW = canvasW - pad * 2;
  const innerH = canvasH - pad - bottomExtra;
  const bandH = canvasH * ((overlay.heightPct ?? 7.5) / 100);

  ctx.fillStyle = border;
  ctx.fillRect(0, 0, canvasW, innerY);
  ctx.fillRect(0, innerY, innerX, innerH);
  ctx.fillRect(innerX + innerW, innerY, canvasW - innerX - innerW, innerH);
  ctx.fillRect(0, innerY + innerH, canvasW, canvasH - innerY - innerH);

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    canvasH - bandH / 2,
    canvasW * ((overlay.maxLogoWidthPct ?? 28) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 3.2) / 100),
  );
}

async function drawGhostLogo(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW * ((overlay.xPct ?? 78) / 100),
    canvasH * ((overlay.yPct ?? 88) / 100),
    canvasW * ((overlay.widthPct ?? 34) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? overlay.heightPct ?? 12) / 100),
    {
      opacity: overlay.opacity ?? 0.3,
      rotationDeg: overlay.rotationDeg,
      blendMode: overlay.blendMode,
    },
  );
}

async function drawDiagonalStamp(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW * ((overlay.xPct ?? 50) / 100),
    canvasH * ((overlay.yPct ?? 50) / 100),
    canvasW * ((overlay.widthPct ?? 30) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? overlay.heightPct ?? 10) / 100),
    {
      opacity: overlay.opacity ?? 0.65,
      rotationDeg: overlay.rotationDeg ?? -10,
      blendMode: overlay.blendMode,
    },
  );
}

async function drawCornerBadge(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const badgeW = canvasW * ((overlay.widthPct ?? 24) / 100);
  const badgeH = canvasH * ((overlay.heightPct ?? 6) / 100);
  const corner = overlay.corner ?? "top-right";
  const x = corner.endsWith("right") ? canvasW - badgeW : 0;
  const y = corner.startsWith("bottom") ? canvasH - badgeH : 0;

  ctx.fillStyle = overlay.backgroundColor ?? "#000000";
  ctx.fillRect(x, y, badgeW, badgeH);
  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    x + badgeW / 2,
    y + badgeH / 2,
    canvasW * ((overlay.maxLogoWidthPct ?? overlay.widthPct ?? 14) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 2.6) / 100),
  );
}

async function drawEdgeRibbon(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const edge = overlay.edge ?? "left";
  const ribbonW = canvasW * ((overlay.widthPct ?? 6) / 100);
  const ribbonH = canvasH * ((overlay.heightPct ?? 4) / 100);
  ctx.fillStyle = overlay.backgroundColor ?? "#000000";

  if (edge === "left" || edge === "right") {
    const x = edge === "right" ? canvasW - ribbonW : 0;
    ctx.fillRect(x, 0, ribbonW, canvasH);
    await drawContainedLogo(
      ctx,
      overlay.logoSrc,
      x + ribbonW / 2,
      canvasH / 2,
      canvasH * ((overlay.maxLogoWidthPct ?? 18) / 100),
      ribbonW * 0.58,
      { rotationDeg: edge === "left" ? -90 : 90 },
    );
    return;
  }

  const y = edge === "bottom" ? canvasH - ribbonH : 0;
  ctx.fillRect(0, y, canvasW, ribbonH);
  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    y + ribbonH / 2,
    canvasW * ((overlay.maxLogoWidthPct ?? 20) / 100),
    canvasH * ((overlay.maxLogoHeightPct ?? 2.4) / 100),
  );
}

async function drawPanoramaSeam(
  ctx: CanvasRenderingContext2D,
  overlay: BrandOverlay,
  canvasW: number,
  canvasH: number,
) {
  const bandW = canvasW * ((overlay.widthPct ?? 34) / 100);
  const bandH = canvasH * ((overlay.heightPct ?? 5.5) / 100);
  const x = (canvasW - bandW) / 2;
  const y = canvasH * 0.5 - bandH / 2;

  ctx.globalAlpha = overlay.opacity ?? 0.92;
  ctx.fillStyle = overlay.backgroundColor ?? "#000000";
  ctx.fillRect(x, y, bandW, bandH);
  ctx.globalAlpha = 1;

  ctx.fillStyle = overlay.backgroundColor ?? "#000000";
  ctx.fillRect(canvasW / 2 - 1, canvasH * 0.08, 2, canvasH * 0.84);

  await drawContainedLogo(
    ctx,
    overlay.logoSrc,
    canvasW / 2,
    canvasH / 2,
    bandW * 0.62,
    bandH * 0.42,
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
  const { brand, templateId, width, height, borderWidth } = opts;
  if (!brand) return;

  for (const overlay of brand.overlays) {
    if (!overlayApplies(overlay, templateId)) continue;

    ctx.save();
    if (overlay.placement === "polaroid-frame") {
      await drawPolaroidFrameOverlay(ctx, overlay, width, height, borderWidth);
    } else if (overlay.placement === "bottom-band") {
      await drawBottomBand(ctx, overlay, width, height);
    } else if (overlay.placement === "bottom-mark") {
      await drawBottomMark(ctx, overlay, width, height);
    } else if (overlay.placement === "corner-badge") {
      await drawCornerBadge(ctx, overlay, width, height);
    } else if (overlay.placement === "diagonal-stamp") {
      await drawDiagonalStamp(ctx, overlay, width, height);
    } else if (overlay.placement === "edge-ribbon") {
      await drawEdgeRibbon(ctx, overlay, width, height);
    } else if (overlay.placement === "ghost-logo") {
      await drawGhostLogo(ctx, overlay, width, height);
    } else if (overlay.placement === "panorama-seam") {
      await drawPanoramaSeam(ctx, overlay, width, height);
    }
    ctx.restore();
  }
}
