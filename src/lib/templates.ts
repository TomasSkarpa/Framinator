import { buildLayeredPrintsSlides, syncLayeredPrintsSlides } from "./layered-prints";
import {
  buildSpreadSlides,
  isLayeredSpreadTemplate,
  reflowSpreadSlides,
  spreadSlideHasContent,
  syncSpreadSlides,
} from "./layered-spreads";
import { uid } from "./utils";
import type { PhotoItem, Slide, TemplateId, TemplateMeta } from "./types";

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "framed-polaroid",
    name: "Framed polaroid",
    description: "Bordered, one per slide",
    icon: "frame",
  },
  {
    id: "clean-carousel",
    name: "Clean carousel",
    description: "Uniform crop and filter",
    icon: "carousel",
  },
  {
    id: "kodak-strip",
    name: "Kodak strip",
    description: "Film frame on paper",
    icon: "film",
  },
  {
    id: "layered-prints",
    name: "Layered prints",
    description: "Snapshots on a scene",
    icon: "layers",
  },
  {
    id: "layered-prints-panorama",
    name: "Panorama spread",
    description: "Print spans two slides",
    icon: "panorama",
  },
  {
    id: "layered-spread-scatter",
    name: "Scatter spread",
    description: "Messy desk, four prints",
    icon: "scatter",
  },
  {
    id: "layered-spread-cascade",
    name: "Diagonal cascade",
    description: "Steps across the spread",
    icon: "cascade",
  },
  {
    id: "layered-spread-corner",
    name: "Corner bleed",
    description: "Big crop, corner peek",
    icon: "corner",
  },
  {
    id: "layered-spread-tilted",
    name: "Tilted pile",
    description: "Rotated polaroids",
    icon: "tilted",
  },
  {
    id: "layered-spread-split",
    name: "Split focus",
    description: "Hero plus detail shots",
    icon: "split",
  },
  {
    id: "soft-focus",
    name: "Soft focus",
    description: "Blurred backdrop, framed photo",
    icon: "focus",
  },
];

const VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));

export function normalizeTemplateId(value: string | null | undefined): TemplateId | null {
  if (!value || !VALID_TEMPLATE_IDS.has(value as TemplateId)) return null;
  return value as TemplateId;
}

/** Build slide list from photos + template. Preserves photo order. */
export function buildSlides(templateId: TemplateId, photos: PhotoItem[]): Slide[] {
  if (templateId === "layered-prints") return buildLayeredPrintsSlides(photos);
  if (isLayeredSpreadTemplate(templateId)) return buildSpreadSlides(templateId, photos);
  if (photos.length === 0) return [];
  return photos.map((p) => ({
    id: uid(),
    cells: [{ photoId: p.id }],
  }));
}

/** Rebuild slides; layered templates keep carousel order and reflow photos from tray order. */
export function slidesFromPhotos(
  templateId: TemplateId | null,
  photos: PhotoItem[],
  existing: Slide[] = [],
): Slide[] {
  if (!templateId) return [];
  if (templateId === "layered-prints") {
    return syncLayeredPrintsSlides(existing, photos);
  }
  if (isLayeredSpreadTemplate(templateId)) {
    return syncSpreadSlides(templateId, existing, photos);
  }
  if (photos.length === 0) return [];
  return buildSlides(templateId, photos);
}

export function isLayeredTemplate(templateId: TemplateId | null): boolean {
  return templateId === "layered-prints" || isLayeredSpreadTemplate(templateId);
}

/** Photo IDs currently assigned to slides. */
export function usedPhotoIds(slides: Slide[]): Set<string> {
  const ids = new Set<string>();
  for (const slide of slides) {
    for (const cell of slide.cells) {
      ids.add(cell.photoId);
    }
    if (slide.layeredPrints?.background.kind === "photo" && slide.layeredPrints.background.photoId) {
      ids.add(slide.layeredPrints.background.photoId);
    }
    for (const print of slide.layeredPrints?.prints ?? []) {
      if (print.photoId) ids.add(print.photoId);
    }
    if (slide.layeredPrints?.spreadPrint?.photoId) {
      ids.add(slide.layeredPrints.spreadPrint.photoId);
    }
  }
  return ids;
}

export { reflowSpreadSlides, spreadSlideHasContent };
