import { uid } from "./utils";
import type { PhotoItem, Slide, TemplateId, TemplateMeta } from "./types";

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "grid-split",
    name: "Grid split",
    description: "3-slide seamless grid",
    icon: "grid",
  },
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
    id: "story-arc",
    name: "Story arc",
    description: "Mixed layout, cover slide",
    icon: "story",
  },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/** Build slide list from photos + template. Preserves photo order. */
export function buildSlides(templateId: TemplateId, photos: PhotoItem[]): Slide[] {
  if (photos.length === 0) return [];

  switch (templateId) {
    case "grid-split": {
      const slides: Slide[] = [];
      for (const group of chunk(photos, 3)) {
        const padded = [...group];
        while (padded.length < 3) {
          padded.push(group[group.length - 1]);
        }
        for (let col = 0; col < 3; col++) {
          slides.push({
            id: uid(),
            cells: [{ photoId: padded[col].id, gridColumn: col }],
          });
        }
      }
      return slides;
    }
    case "framed-polaroid":
    case "clean-carousel":
      return photos.map((p) => ({
        id: uid(),
        cells: [{ photoId: p.id }],
      }));
    case "story-arc": {
      const slides: Slide[] = [];
      photos.forEach((p, i) => {
        slides.push({
          id: uid(),
          cells: [
            {
              photoId: p.id,
              variant: i === 0 ? "cover" : i % 2 === 0 ? "inset" : "full",
            },
          ],
        });
      });
      return slides;
    }
  }
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
