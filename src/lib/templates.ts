import { buildLayeredPrintsSlides, syncLayeredPrintsSlides } from "./layered-prints";
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
];

const VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));

export function normalizeTemplateId(value: string | null | undefined): TemplateId | null {
  if (!value || !VALID_TEMPLATE_IDS.has(value as TemplateId)) return null;
  return value as TemplateId;
}

/** Build slide list from photos + template. Preserves photo order. */
export function buildSlides(templateId: TemplateId, photos: PhotoItem[]): Slide[] {
  if (photos.length === 0) return [];
  if (templateId === "layered-prints") return buildLayeredPrintsSlides(photos);
  return photos.map((p) => ({
    id: uid(),
    cells: [{ photoId: p.id }],
  }));
}

/** Rebuild slides; layered-prints preserves slide order and reflows photos. */
export function slidesFromPhotos(
  templateId: TemplateId | null,
  photos: PhotoItem[],
  existing: Slide[] = [],
): Slide[] {
  if (!templateId || photos.length === 0) return [];
  if (templateId === "layered-prints") {
    return existing.length > 0
      ? syncLayeredPrintsSlides(existing, photos)
      : buildLayeredPrintsSlides(photos);
  }
  return buildSlides(templateId, photos);
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
  }
  return ids;
}
