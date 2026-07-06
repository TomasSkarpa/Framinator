import { DEFAULT_PHOTO_CROP } from "./constants";
import {
  buildSpreadSlides,
  cellsFromSpreadLayout,
  PANORAMA_OVERLAY_SPEC,
  reflowSpreadSlides,
  spreadIndexFromRole,
  spreadSlideHasContent,
  SPREAD_SLIDES_PER_SPREAD,
  syncSpreadSlides,
} from "./layered-spreads";
import type { LayeredPrintsLayout, PhotoItem, Slide } from "./types";

export { PANORAMA_OVERLAY_SPEC };
export const PANORAMA_SLOTS_PER_SPREAD = 3;
export const PANORAMA_SLIDES_PER_SPREAD = SPREAD_SLIDES_PER_SPREAD;

const TEMPLATE_ID = "layered-prints-panorama" as const;

export function cellsFromPanoramaLayout(layout: LayeredPrintsLayout): { photoId: string }[] {
  return cellsFromSpreadLayout(layout);
}

export function reflowPanoramaSlides(slides: Slide[], photos: PhotoItem[]): Slide[] {
  return reflowSpreadSlides(TEMPLATE_ID, slides, photos);
}

export function syncPanoramaSlides(existing: Slide[], photos: PhotoItem[]): Slide[] {
  return syncSpreadSlides(TEMPLATE_ID, existing, photos);
}

export function buildPanoramaSlides(photos: PhotoItem[]): Slide[] {
  return buildSpreadSlides(TEMPLATE_ID, photos);
}

export const panoramaSlideHasContent = spreadSlideHasContent;
export const panoramaSpreadIndex = spreadIndexFromRole;

// ponytail: dev-only guard; spread slotting + sticky slide reorder
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const stub = (id: string): PhotoItem => ({
    id,
    name: id,
    objectUrl: "",
    crop: { ...DEFAULT_PHOTO_CROP },
  });
  const photos = [stub("bg1"), stub("ov"), stub("bg2"), stub("bg3")];
  const built = buildPanoramaSlides(photos);
  if (built.length !== 4) {
    throw new Error("panorama self-check: expected 4 slides for 4 photos");
  }
  const spread0 = built[0].layeredPrints;
  const spread1 = built[1].layeredPrints;
  if (
    spread0?.spreadId !== spread1?.spreadId ||
    spread0?.background.kind !== "photo" ||
    spread0.background.photoId !== "bg1" ||
    spread0.spreadPrint?.photoId !== "ov" ||
    spread1?.background.kind !== "photo" ||
    spread1.background.photoId !== "bg2"
  ) {
    throw new Error("panorama self-check: first spread slotting broken");
  }
  const reflowed = reflowPanoramaSlides(built, [stub("x"), stub("y"), stub("z")]);
  const leftBg = reflowed[0].layeredPrints?.background;
  if (leftBg?.kind !== "photo" || leftBg.photoId !== "x") {
    throw new Error("panorama self-check: photo tray reorder reflow broken");
  }
  const swapped = [...built];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const stickyOverlay = swapped[0].layeredPrints?.spreadPrint?.photoId;
  if (stickyOverlay !== "ov") {
    throw new Error("panorama self-check: sticky slide reorder broken");
  }
}
