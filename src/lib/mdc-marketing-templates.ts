import { drawCover } from "./crop-math";
import { applyLutToCanvas, type Lut3D } from "./lut";
import type { LayeredPrintsRole, PhotoCrop, TemplateId, TemplateMeta } from "./types";

export const MDC_MARKETING_TEMPLATE_IDS = [
  "mdc-editorial-poster-frame",
  "mdc-red-bracket-system",
  "mdc-floating-caption-bar",
  "mdc-white-logo-red-shadow",
  "mdc-gradient-footer-takeover",
  "mdc-red-duotone-split",
  "mdc-conference-masthead",
  "mdc-repeating-event-spine",
  "mdc-diagonal-campaign-wrap",
  "mdc-black-lower-third-plate",
  "mdc-sharp-red-corner-wedge",
  "mdc-right-side-brand-slab",
  "mdc-repeating-logo-texture",
  "mdc-oversized-translucent-mark",
  "mdc-monochrome-red-footer-fade",
] as const satisfies readonly TemplateId[];

export type MdcMarketingTemplateId = (typeof MDC_MARKETING_TEMPLATE_IDS)[number];

export const MDC_MARKETING_TEMPLATES: TemplateMeta[] = [
  {
    id: "mdc-editorial-poster-frame",
    name: "Editorial poster frame",
    description: "V2 / 01",
    icon: "frame",
  },
  {
    id: "mdc-red-bracket-system",
    name: "Red bracket system",
    description: "V2 / 02",
    icon: "corner",
  },
  {
    id: "mdc-floating-caption-bar",
    name: "Floating caption bar",
    description: "V2 / 03",
    icon: "focus",
  },
  {
    id: "mdc-white-logo-red-shadow",
    name: "White mark red shadow",
    description: "V2 / 04",
    icon: "frame",
  },
  {
    id: "mdc-gradient-footer-takeover",
    name: "Gradient footer takeover",
    description: "V2 / 05",
    icon: "focus",
  },
  {
    id: "mdc-red-duotone-split",
    name: "Red duotone split",
    description: "V2 / 06",
    icon: "split",
  },
  {
    id: "mdc-conference-masthead",
    name: "Conference masthead",
    description: "V2 / 07",
    icon: "panorama",
  },
  {
    id: "mdc-repeating-event-spine",
    name: "Repeating event spine",
    description: "V2 / 08",
    icon: "layers",
  },
  {
    id: "mdc-diagonal-campaign-wrap",
    name: "Diagonal campaign wrap",
    description: "V2 / 09",
    icon: "tilted",
  },
  {
    id: "mdc-black-lower-third-plate",
    name: "Black lower-third plate",
    description: "V2 / 10",
    icon: "split",
  },
  {
    id: "mdc-sharp-red-corner-wedge",
    name: "Sharp red corner wedge",
    description: "V2 / 11",
    icon: "corner",
  },
  {
    id: "mdc-right-side-brand-slab",
    name: "Right-side brand slab",
    description: "V2 / 12",
    icon: "split",
  },
  {
    id: "mdc-repeating-logo-texture",
    name: "Repeating logo texture",
    description: "V2 / 14",
    icon: "layers",
  },
  {
    id: "mdc-oversized-translucent-mark",
    name: "Oversized translucent mark",
    description: "V2 / 20",
    icon: "frame",
  },
  {
    id: "mdc-monochrome-red-footer-fade",
    name: "Monochrome red footer fade",
    description: "V2 / 22",
    icon: "focus",
  },
];

const RED = "#ee0015";
const INK = "#111111";
const PAPER = "#f2eee6";
const WHITE = "#ffffff";
const LOGO_WHITE = "/branding/mdc/logo-white.png";
const LOGO_RED = "/branding/mdc/logo-red.png";

const logoCache = new Map<string, Promise<HTMLImageElement>>();

function loadLogo(src: string): Promise<HTMLImageElement> {
  let pending = logoCache.get(src);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    logoCache.set(src, pending);
  }
  return pending;
}

export function isMdcMarketingTemplate(
  templateId: TemplateId | null,
): templateId is MdcMarketingTemplateId {
  return !!templateId && MDC_MARKETING_TEMPLATE_IDS.includes(templateId as MdcMarketingTemplateId);
}

async function drawCoverWithLut(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: PhotoCrop,
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

async function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: PhotoCrop,
  canvasW: number,
  canvasH: number,
  lut: Lut3D | null,
  rect = { x: 0, y: 0, w: canvasW, h: canvasH },
  filter?: string,
) {
  ctx.save();
  if (filter) ctx.filter = filter;
  await drawCoverWithLut(ctx, img, crop, rect.x, rect.y, rect.w, rect.h, lut);
  ctx.restore();
}

function pctW(canvasW: number, pct: number) {
  return canvasW * (pct / 100);
}

function pctH(canvasH: number, pct: number) {
  return canvasH * (pct / 100);
}

function drawMicroText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { align?: CanvasTextAlign; bg?: string; color?: string } = {},
) {
  ctx.save();
  const fontSize = Math.max(10, Math.round(x * 0.018));
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = opts.color ?? WHITE;
  if (opts.bg) {
    const metrics = ctx.measureText(text);
    const pad = fontSize * 0.5;
    const rectX = opts.align === "right" ? x - metrics.width - pad : x - pad;
    ctx.fillStyle = opts.bg;
    ctx.fillRect(rectX, y - pad * 0.55, metrics.width + pad * 2, fontSize + pad);
    ctx.fillStyle = opts.color ?? WHITE;
  }
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  src: string,
  canvasW: number,
  canvasH: number,
  opts: {
    cx?: number;
    cy?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    widthPct: number;
    rotateDeg?: number;
    opacity?: number;
    blendMode?: GlobalCompositeOperation;
    shadowColor?: string;
    shadowOffsetXPct?: number;
    shadowOffsetYPct?: number;
    shadowBlurPct?: number;
  },
) {
  const logo = await loadLogo(src);
  const iw = logo.naturalWidth || logo.width;
  const ih = logo.naturalHeight || logo.height;
  const drawW = pctW(canvasW, opts.widthPct);
  const drawH = drawW * (ih / iw);
  let x = opts.cx !== undefined ? opts.cx - drawW / 2 : 0;
  let y = opts.cy !== undefined ? opts.cy - drawH / 2 : 0;
  if (opts.left !== undefined) x = opts.left;
  if (opts.right !== undefined) x = canvasW - opts.right - drawW;
  if (opts.top !== undefined) y = opts.top;
  if (opts.bottom !== undefined) y = canvasH - opts.bottom - drawH;

  ctx.save();
  ctx.globalAlpha = opts.opacity ?? 1;
  ctx.globalCompositeOperation = opts.blendMode ?? "source-over";
  if (opts.shadowColor) {
    ctx.shadowColor = opts.shadowColor;
    ctx.shadowOffsetX = pctW(canvasW, opts.shadowOffsetXPct ?? 0);
    ctx.shadowOffsetY = pctW(canvasW, opts.shadowOffsetYPct ?? 0);
    ctx.shadowBlur = pctW(canvasW, opts.shadowBlurPct ?? 0);
  }
  if (opts.rotateDeg) {
    ctx.translate(x + drawW / 2, y + drawH / 2);
    ctx.rotate((opts.rotateDeg * Math.PI) / 180);
    ctx.drawImage(logo, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.drawImage(logo, x, y, drawW, drawH);
  }
  ctx.restore();
}

async function drawLogoInBox(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fillPct = 0.72,
  rotateDeg = 0,
) {
  const logo = await loadLogo(src);
  const iw = logo.naturalWidth || logo.width;
  const ih = logo.naturalHeight || logo.height;
  const scale = Math.min((w * fillPct) / iw, (h * fillPct) / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rotateDeg) ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.drawImage(logo, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawBottomBar(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, yPct: number, hPct: number, color = RED, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, pctH(canvasH, yPct), canvasW, pctH(canvasH, hPct));
  ctx.restore();
}

async function drawRepeatedLogoPattern(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
) {
  const logo = await loadLogo(LOGO_RED);
  const tileW = pctW(canvasW, 43);
  const tileH = tileW * ((logo.naturalHeight || logo.height) / (logo.naturalWidth || logo.width));
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.globalCompositeOperation = "multiply";
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.translate(-canvasW / 2, -canvasH / 2);
  for (let y = -canvasH * 0.2; y < canvasH * 1.2; y += tileH * 1.45) {
    for (let x = -canvasW * 0.28; x < canvasW * 1.25; x += tileW * 0.95) {
      ctx.drawImage(logo, x, y, tileW, tileH);
    }
  }
  ctx.restore();
}

function drawRedGradientFooter(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  startPct = 52,
) {
  const y = pctH(canvasH, startPct);
  const gradient = ctx.createLinearGradient(0, y, 0, canvasH);
  gradient.addColorStop(0, "rgba(238,0,21,0)");
  gradient.addColorStop(0.56, "rgba(238,0,21,0.72)");
  gradient.addColorStop(1, "rgba(238,0,21,0.96)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, canvasW, canvasH - y);
}

function drawFirstSlideOnlyNotice(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
) {
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, canvasW, canvasH);
}

export async function drawMdcMarketingTemplate(
  ctx: CanvasRenderingContext2D,
  templateId: MdcMarketingTemplateId,
  img: HTMLImageElement,
  crop: PhotoCrop,
  canvasW: number,
  canvasH: number,
  lut: Lut3D | null,
  overlayEnabled = false,
) {
  if (!overlayEnabled) {
    await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
    drawFirstSlideOnlyNotice(ctx, canvasW, canvasH);
    return;
  }

  switch (templateId) {
    case "mdc-editorial-poster-frame": {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, canvasW, canvasH);
      const padX = pctW(canvasW, 5.8);
      const top = pctW(canvasW, 5.8);
      const bottom = pctH(canvasH, 13.4);
      const border = pctW(canvasW, 4.2);
      const outer = { x: padX, y: top, w: canvasW - padX * 2, h: canvasH - top - bottom };
      ctx.fillStyle = RED;
      ctx.fillRect(outer.x, outer.y, outer.w, outer.h);
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut, {
        x: outer.x + border,
        y: outer.y + border,
        w: outer.w - border * 2,
        h: outer.h - border * 2,
      });
      const badgeW = pctW(canvasW, 30);
      const badgeH = pctH(canvasH, 6.5);
      const badgeX = canvasW - pctW(canvasW, 9) - badgeW;
      const badgeY = canvasH - pctH(canvasH, 6) - badgeH;
      ctx.fillStyle = RED;
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      await drawLogoInBox(ctx, LOGO_WHITE, badgeX, badgeY, badgeW, badgeH, 0.72);
      break;
    }
    case "mdc-red-bracket-system": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut, undefined, "contrast(1.08) saturate(0.9)");
      const line = pctW(canvasW, 4.2);
      const inset = pctW(canvasW, 7);
      const bottomY = canvasH - pctH(canvasH, 8) - line;
      ctx.fillStyle = RED;
      ctx.fillRect(inset, pctH(canvasH, 20), line, pctH(canvasH, 72));
      ctx.fillRect(inset, bottomY, pctW(canvasW, 58), line);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        left: pctW(canvasW, 12),
        bottom: pctH(canvasH, 13),
        widthPct: 32,
      });
      break;
    }
    case "mdc-floating-caption-bar": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      drawBottomBar(ctx, canvasW, canvasH, 74, 13, RED, 0.92);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        cx: canvasW / 2,
        cy: pctH(canvasH, 80.5),
        widthPct: 39,
      });
      break;
    }
    case "mdc-white-logo-red-shadow": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        cx: canvasW / 2,
        bottom: pctH(canvasH, 8),
        widthPct: 46,
        shadowColor: RED,
        shadowOffsetXPct: 1.9,
        shadowOffsetYPct: 1.9,
        shadowBlurPct: 0,
      });
      break;
    }
    case "mdc-gradient-footer-takeover": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      drawRedGradientFooter(ctx, canvasW, canvasH, 52);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        cx: canvasW / 2,
        bottom: pctH(canvasH, 6),
        widthPct: 42,
      });
      break;
    }
    case "mdc-red-duotone-split": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut, undefined, "grayscale(1) contrast(1.25)");
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, pctW(canvasW, 56), canvasH);
      ctx.restore();
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        left: pctW(canvasW, 7),
        bottom: pctH(canvasH, 8),
        widthPct: 34,
      });
      drawMicroText(ctx, "FIELD REPORT", pctW(canvasW, 93), pctH(canvasH, 7), { align: "right" });
      break;
    }
    case "mdc-conference-masthead": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, canvasW, pctH(canvasH, 16));
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        left: pctW(canvasW, 7),
        top: pctH(canvasH, 5.2),
        widthPct: 31,
      });
      drawMicroText(ctx, "WORLD CONGRESS", pctW(canvasW, 93), pctH(canvasH, 7), { align: "right" });
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, pctH(canvasH, 16), canvasW, Math.max(2, pctW(canvasW, 0.9)));
      break;
    }
    case "mdc-repeating-event-spine": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      const spineW = pctW(canvasW, 22);
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, spineW, canvasH);
      for (const cy of [0.17, 0.5, 0.83]) {
        await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
          cx: spineW / 2,
          cy: canvasH * cy,
          widthPct: 37,
          rotateDeg: -90,
        });
      }
      break;
    }
    case "mdc-diagonal-campaign-wrap": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      ctx.save();
      ctx.translate(canvasW / 2, pctH(canvasH, 50));
      ctx.rotate((-17 * Math.PI) / 180);
      ctx.fillStyle = RED;
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = pctW(canvasW, 4);
      ctx.shadowOffsetY = pctW(canvasW, 2.5);
      ctx.fillRect(-canvasW * 0.62, -pctH(canvasH, 8), canvasW * 1.24, pctH(canvasH, 16));
      ctx.shadowColor = "transparent";
      await drawLogoInBox(ctx, LOGO_WHITE, -canvasW * 0.18, -pctH(canvasH, 8), canvasW * 0.36, pctH(canvasH, 16), 0.92);
      ctx.restore();
      break;
    }
    case "mdc-black-lower-third-plate": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      const x = pctW(canvasW, 6);
      const y = pctH(canvasH, 76);
      const bw = pctW(canvasW, 88);
      const bh = pctH(canvasH, 17);
      ctx.fillStyle = INK;
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = RED;
      ctx.fillRect(x, y, bw, pctW(canvasW, 2.6));
      await drawLogoInBox(ctx, LOGO_WHITE, x, y, bw, bh, 0.41);
      break;
    }
    case "mdc-sharp-red-corner-wedge": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut, undefined, "saturate(1.1) contrast(1.08)");
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(canvasW, 0);
      ctx.lineTo(canvasW, pctH(canvasH, 34));
      ctx.lineTo(pctW(canvasW, 24), 0);
      ctx.closePath();
      ctx.fill();
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        right: pctW(canvasW, 8),
        top: pctH(canvasH, 7),
        widthPct: 32,
      });
      break;
    }
    case "mdc-right-side-brand-slab": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      drawMicroText(ctx, "MDC / LIVE", pctW(canvasW, 7), pctH(canvasH, 7), { bg: INK });
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = RED;
      ctx.fillRect(pctW(canvasW, 66), 0, pctW(canvasW, 34), canvasH);
      ctx.restore();
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        cx: pctW(canvasW, 83),
        cy: canvasH / 2,
        widthPct: 41,
        rotateDeg: 90,
      });
      break;
    }
    case "mdc-repeating-logo-texture": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut, undefined, "contrast(1.05)");
      await drawRepeatedLogoPattern(ctx, canvasW, canvasH);
      break;
    }
    case "mdc-oversized-translucent-mark": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut);
      ctx.fillStyle = "rgba(238,0,21,0.16)";
      ctx.fillRect(0, 0, canvasW, canvasH);
      await drawLogo(ctx, LOGO_RED, canvasW, canvasH, {
        cx: canvasW / 2,
        cy: pctH(canvasH, 52),
        widthPct: 118,
        opacity: 0.52,
        blendMode: "multiply",
      });
      break;
    }
    case "mdc-monochrome-red-footer-fade": {
      await drawPhoto(ctx, img, crop, canvasW, canvasH, lut, undefined, "grayscale(1) contrast(1.18)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(238,0,21,0.2)";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();
      const gradient = ctx.createLinearGradient(0, pctH(canvasH, 62), 0, canvasH);
      gradient.addColorStop(0, "rgba(17,17,17,0)");
      gradient.addColorStop(1, INK);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, pctH(canvasH, 62), canvasW, pctH(canvasH, 38));
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        cx: canvasW / 2,
        bottom: pctH(canvasH, 7),
        widthPct: 40,
      });
      break;
    }
  }
}

const MDC_BRANDED_SPREAD_TEMPLATES = new Set<TemplateId>([
  "layered-prints-panorama",
  "layered-spread-scatter",
]);

export function hasMdcBrandedSpreadAccent(templateId: TemplateId | null): boolean {
  return !!templateId && MDC_BRANDED_SPREAD_TEMPLATES.has(templateId);
}

/**
 * Draws MDC brand accents on top of an already-rendered spread slide.
 * Each accent is placed in a pixel zone where no print layer lands, so they
 * never fight the composition. Call after drawSpreadLayeredSlide.
 *
 * Panorama geometry: wide print occupies y=58–86% on both slides.
 *   Left  → full conference masthead bar (0–14%), white divider line below.
 *   Right → quiet bottom badge (y=93–100%), right-aligned logo.
 *
 * Scatter geometry: prints start at y=8% on the left, last print ends at y=88% on the right.
 *   Left  → thin masthead (0–7%), logo right-aligned (asymmetric; echoes the scattered composition).
 *   Right → thin bottom bar (93–100%), logo left-aligned (bookend reversal).
 */
export async function drawMdcBrandedSpreadAccent(
  ctx: CanvasRenderingContext2D,
  role: LayeredPrintsRole,
  canvasW: number,
  canvasH: number,
): Promise<void> {
  switch (role) {
    case "panorama-left": {
      // Full masthead bar — same language as mdc-conference-masthead.
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, canvasW, pctH(canvasH, 14));
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        left: pctW(canvasW, 7),
        top: pctH(canvasH, 4),
        widthPct: 31,
      });
      drawMicroText(ctx, "WORLD CONGRESS", pctW(canvasW, 93), pctH(canvasH, 7), { align: "right" });
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, pctH(canvasH, 14), canvasW, Math.max(2, pctW(canvasW, 0.9)));
      break;
    }
    case "panorama-right": {
      // Quiet bottom badge — bookend to the left masthead.
      const badgeH = pctH(canvasH, 6);
      ctx.fillStyle = RED;
      ctx.fillRect(0, canvasH - badgeH, canvasW, badgeH);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        right: pctW(canvasW, 7),
        bottom: pctH(canvasH, 0.8),
        widthPct: 27,
      });
      break;
    }
    case "scatter-left": {
      // Thin masthead above the prints (prints start at yPct=8, bar is 7%).
      // Logo right-aligned: asymmetry matches the scattered, left-leaning print layout.
      const barH = pctH(canvasH, 7);
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, canvasW, barH);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        right: pctW(canvasW, 5),
        top: pctH(canvasH, 0.8),
        widthPct: 28,
      });
      break;
    }
    case "scatter-right": {
      // Bottom badge below the last print (last print ends at yPct=88, bar is 7%).
      // Logo left-aligned: reverses the left-slide asymmetry, closing the spread.
      const barH = pctH(canvasH, 7);
      ctx.fillStyle = RED;
      ctx.fillRect(0, canvasH - barH, canvasW, barH);
      await drawLogo(ctx, LOGO_WHITE, canvasW, canvasH, {
        left: pctW(canvasW, 5),
        bottom: pctH(canvasH, 0.8),
        widthPct: 28,
      });
      break;
    }
  }
}
