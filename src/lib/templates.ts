import { buildLayeredPrintsSlides, syncLayeredPrintsSlides } from "./layered-prints";
import {
  buildSpreadSlides,
  isLayeredSpreadTemplate,
  reflowSpreadSlides,
  spreadPrintsForLayout,
  spreadSlideHasContent,
  syncSpreadSlides,
} from "./layered-spreads";
import { isMdcMarketingTemplate, MDC_MARKETING_TEMPLATES } from "./mdc-marketing-templates";
import { uid } from "./utils";
import type { PhotoItem, Slide, TemplateId, TemplateMeta } from "./types";

export const BASE_TEMPLATE_IDS = [
  "clean-carousel",
  "framed-polaroid",
  "layered-spread-split",
  "layered-prints-panorama",
  "layered-spread-tilted",
  "layered-spread-scatter",
  "layered-spread-cascade",
  "layered-spread-corner",
  "layered-prints",
  "kodak-strip",
  "soft-focus",
] as const satisfies readonly TemplateId[];

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "clean-carousel",
    name: "Clean carousel",
    description: "Uniform crop and filter",
    icon: "carousel",
  },
  {
    id: "framed-polaroid",
    name: "Framed polaroid",
    description: "Bordered, one per slide",
    icon: "frame",
  },
  {
    id: "layered-spread-split",
    name: "Split focus",
    description: "Hero plus detail shots",
    icon: "split",
  },
  {
    id: "layered-prints-panorama",
    name: "Panorama spread",
    description: "Print spans two slides",
    icon: "panorama",
  },
  {
    id: "layered-spread-tilted",
    name: "Tilted pile",
    description: "Rotated polaroids",
    icon: "tilted",
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
    id: "layered-prints",
    name: "Layered prints",
    description: "Snapshots on a scene",
    icon: "layers",
  },
  {
    id: "kodak-strip",
    name: "Kodak strip",
    description: "Film frame on paper",
    icon: "film",
  },
  {
    id: "soft-focus",
    name: "Soft focus",
    description: "Blurred backdrop, framed photo",
    icon: "focus",
  },
  ...MDC_MARKETING_TEMPLATES,
];

const VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));
const TEMPLATE_META_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function normalizeTemplateId(value: string | null | undefined): TemplateId | null {
  if (!value || !VALID_TEMPLATE_IDS.has(value as TemplateId)) return null;
  return value as TemplateId;
}

export function templatesForIds(ids: readonly TemplateId[]): TemplateMeta[] {
  return ids.map((id) => TEMPLATE_META_BY_ID.get(id)).filter((t): t is TemplateMeta => !!t);
}

export function isFramedPolaroidTemplate(templateId: TemplateId | null): boolean {
  return templateId === "framed-polaroid";
}

export function isKodakStripTemplate(templateId: TemplateId | null): boolean {
  return templateId === "kodak-strip";
}

export function isSoftFocusTemplate(templateId: TemplateId | null): boolean {
  return templateId === "soft-focus";
}

/** Build slide list from photos + template. Preserves photo order. */
export function buildSlides(templateId: TemplateId, photos: PhotoItem[]): Slide[] {
  if (templateId === "layered-prints") return buildLayeredPrintsSlides(photos);
  if (isLayeredSpreadTemplate(templateId)) return buildSpreadSlides(templateId, photos);
  if (photos.length === 0) return [];
  return photos.map((p, i) => ({
    id: uid(),
    cells: [{ photoId: p.id }],
    ...(isMdcMarketingTemplate(templateId) ? { overlayEnabled: i === 0 } : {}),
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
  if (existing.length > 0) {
    return syncSimpleSlides(existing, photos);
  }
  return buildSlides(templateId, photos);
}

/** One photo per slide; keep slide ids when tray order changes. */
export function syncSimpleSlides(existing: Slide[], photos: PhotoItem[]): Slide[] {
  const byPhoto = new Map<string, Slide>();
  for (const slide of existing) {
    const photoId = slide.cells[0]?.photoId;
    if (photoId) byPhoto.set(photoId, slide);
  }
  return photos.map((photo) => {
    const prior = byPhoto.get(photo.id);
    if (prior) return { ...prior, cells: [{ photoId: photo.id }] };
    return { id: uid(), cells: [{ photoId: photo.id }] };
  });
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
    if (slide.layeredPrints) {
      for (const print of spreadPrintsForLayout(slide.layeredPrints)) {
        if (print.photoId) ids.add(print.photoId);
      }
    }
  }
  return ids;
}

export { reflowSpreadSlides, spreadSlideHasContent };
