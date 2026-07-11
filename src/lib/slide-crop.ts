import { HERO_PRINT_FRAME } from "./layered-prints";
import { spreadPrintsForLayout } from "./layered-spreads";
import type { LayeredPrintsLayout, PrintLayer, Slide, TemplateId } from "./types";

export type CropPlacementKey =
  | "main"
  | "bg"
  | `print-${number}`
  | "spread"
  | `spread-${number}`;

export type SlideCropTarget = {
  key: CropPlacementKey;
  photoId: string;
  label: string;
};

export type CropFrameRect = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  /** Inner photo area after white border (% of canvas). */
  innerInsetPct?: number;
};

function addTarget(
  out: SlideCropTarget[],
  key: CropPlacementKey,
  photoId: string | undefined,
  label: string,
) {
  if (!photoId) return;
  out.push({ key, photoId, label });
}

/** Photos on a slide that can be cropped (Phase 1: per photo, not per placement). */
export function slideCropTargets(slide: Slide): SlideCropTarget[] {
  const lp = slide.layeredPrints;
  if (lp) return layeredCropTargets(lp);

  const photoId = slide.cells[0]?.photoId;
  return photoId ? [{ key: "main", photoId, label: "Photo" }] : [];
}

function layeredCropTargets(layout: LayeredPrintsLayout): SlideCropTarget[] {
  const out: SlideCropTarget[] = [];
  layout.prints.forEach((p, i) => {
    addTarget(out, `print-${i}`, p.photoId, layout.prints.length > 1 ? `Print ${i + 1}` : "Print");
  });
  const spreadPrints = spreadPrintsForLayout(layout);
  spreadPrints.forEach((p, i) => {
    addTarget(
      out,
      `spread-${i}`,
      p.photoId,
      spreadPrints.length > 1 ? `Print ${i + 1}` : "Print",
    );
  });
  if (layout.background.kind === "photo") {
    addTarget(out, "bg", layout.background.photoId, "Background");
  }
  return out;
}

function printInnerRect(layer: PrintLayer, borderPct: number): CropFrameRect {
  const inset = borderPct;
  return {
    xPct: layer.xPct + (layer.wPct * inset) / 100,
    yPct: layer.yPct + (layer.hPct * inset) / 100,
    wPct: layer.wPct * (1 - (2 * inset) / 100),
    hPct: layer.hPct * (1 - (2 * inset) / 100),
  };
}

/** Frame rect for crop overlay (% of preview container). */
export function cropFrameForPlacement(
  slide: Slide,
  templateId: TemplateId,
  key: CropPlacementKey,
): CropFrameRect {
  if (key === "main" || !slide.layeredPrints) {
    return { xPct: 0, yPct: 0, wPct: 100, hPct: 100 };
  }

  const lp = slide.layeredPrints;
  const borderPct = 1.48;

  if (key === "bg") {
    return { xPct: 0, yPct: 0, wPct: 100, hPct: 100 };
  }
  if (key === "spread" || key.startsWith("spread-")) {
    const idx = key === "spread" ? 0 : Number(key.slice(7));
    const spread = spreadPrintsForLayout(lp)[idx];
    if (!spread) return { xPct: 0, yPct: 0, wPct: 100, hPct: 100 };
    const slideOffset = lp.role.endsWith("-right") ? 100 : 0;
    const layer: PrintLayer = {
      photoId: spread.photoId,
      xPct: spread.spreadXPct - slideOffset,
      yPct: spread.yPct,
      wPct: spread.spreadWPct,
      hPct: spread.hPct,
    };
    return printInnerRect(layer, borderPct);
  }
  if (key.startsWith("print-")) {
    const idx = Number(key.slice(6));
    const layer = lp.prints[idx];
    if (layer) return printInnerRect(layer, borderPct);
  }

  if (templateId === "soft-focus") {
    return printInnerRect({ photoId: "", ...HERO_PRINT_FRAME }, borderPct);
  }

  return { xPct: 0, yPct: 0, wPct: 100, hPct: 100 };
}

export function findSlideUsingPhoto(
  slides: Slide[],
  photoId: string,
): { slideId: string; target: SlideCropTarget } | null {
  for (const slide of slides) {
    const targets = slideCropTargets(slide);
    const match = targets.find((t) => t.photoId === photoId);
    if (match) return { slideId: slide.id, target: match };
  }
  return null;
}
