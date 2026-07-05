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
];

const VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));

export function normalizeTemplateId(value: string | null | undefined): TemplateId | null {
  if (!value || !VALID_TEMPLATE_IDS.has(value as TemplateId)) return null;
  return value as TemplateId;
}

/** Build slide list from photos + template. Preserves photo order. */
export function buildSlides(_templateId: TemplateId, photos: PhotoItem[]): Slide[] {
  if (photos.length === 0) return [];
  return photos.map((p) => ({
    id: uid(),
    cells: [{ photoId: p.id }],
  }));
}

/** Rebuild all slides from the current photo list and template (auto-extend). */
export function slidesFromPhotos(
  templateId: TemplateId | null,
  photos: PhotoItem[],
): Slide[] {
  if (!templateId || photos.length === 0) return [];
  return buildSlides(templateId, photos);
}

/** Photo IDs currently assigned to slides. */
export function usedPhotoIds(slides: Slide[]): Set<string> {
  const ids = new Set<string>();
  for (const slide of slides) {
    for (const cell of slide.cells) {
      ids.add(cell.photoId);
    }
  }
  return ids;
}
