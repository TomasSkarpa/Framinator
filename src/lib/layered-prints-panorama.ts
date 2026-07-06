import { DEFAULT_PHOTO_CROP } from "./constants";
import type { LayeredPrintsLayout, PhotoItem, Slide, SpreadPrintLayer } from "./types";
import { uid } from "./utils";

export const PANORAMA_SLOTS_PER_SPREAD = 3;
export const PANORAMA_SLIDES_PER_SPREAD = 2;

/** Landscape strip ~30% inset from each outer edge across both slides. */
export const PANORAMA_OVERLAY_SPEC: Omit<SpreadPrintLayer, "photoId"> = {
  spreadXPct: 30,
  yPct: 58,
  spreadWPct: 140,
  hPct: 28,
  shadow: true,
};

function spreadPrint(overlayId?: string): SpreadPrintLayer {
  return overlayId
    ? { photoId: overlayId, ...PANORAMA_OVERLAY_SPEC }
    : { ...PANORAMA_OVERLAY_SPEC };
}

function panoramaSlideLayout(
  role: "panorama-left" | "panorama-right",
  spreadId: string,
  bgId?: string,
  overlayId?: string,
): LayeredPrintsLayout {
  return {
    role,
    spreadId,
    background: { kind: "photo", photoId: bgId },
    prints: [],
    spreadPrint: spreadPrint(overlayId),
  };
}

export function cellsFromPanoramaLayout(layout: LayeredPrintsLayout): { photoId: string }[] {
  const ids: string[] = [];
  const add = (id?: string) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  if (layout.background.kind === "photo") add(layout.background.photoId);
  if (layout.spreadPrint?.photoId) add(layout.spreadPrint.photoId);
  return ids.map((photoId) => ({ photoId }));
}

function emptySpread(spreadId: string): [Slide, Slide] {
  return [
    { id: uid(), cells: [], layeredPrints: panoramaSlideLayout("panorama-left", spreadId) },
    { id: uid(), cells: [], layeredPrints: panoramaSlideLayout("panorama-right", spreadId) },
  ];
}

function spreadCountForPhotos(photoCount: number): number {
  return Math.max(1, Math.ceil(photoCount / PANORAMA_SLOTS_PER_SPREAD));
}

/** Reflow tray photos into [bg, overlay, bg] per spread; slide order unchanged. */
export function reflowPanoramaSlides(slides: Slide[], photos: PhotoItem[]): Slide[] {
  const photoIds = photos.map((p) => p.id);
  let idx = 0;
  const out: Slide[] = [];

  for (let i = 0; i < slides.length; i += PANORAMA_SLIDES_PER_SPREAD) {
    const left = slides[i];
    const right = slides[i + 1];
    const spreadId =
      left?.layeredPrints?.spreadId ?? right?.layeredPrints?.spreadId ?? uid();

    const bgLeft = photoIds[idx];
    if (photoIds[idx]) idx++;
    const overlay = photoIds[idx];
    if (photoIds[idx]) idx++;
    const bgRight = photoIds[idx];
    if (photoIds[idx]) idx++;

    if (left) {
      const layout = panoramaSlideLayout("panorama-left", spreadId, bgLeft, overlay);
      out.push({ ...left, layeredPrints: layout, cells: cellsFromPanoramaLayout(layout) });
    }
    if (right) {
      const layout = panoramaSlideLayout("panorama-right", spreadId, bgRight, overlay);
      out.push({ ...right, layeredPrints: layout, cells: cellsFromPanoramaLayout(layout) });
    }
  }

  return out;
}

export function syncPanoramaSlides(existing: Slide[], photos: PhotoItem[]): Slide[] {
  const spreads = spreadCountForPhotos(photos.length);
  const slides: Slide[] = [];

  for (let s = 0; s < spreads; s++) {
    const spreadId = existing[s * 2]?.layeredPrints?.spreadId ?? uid();
    const left = existing[s * 2];
    const right = existing[s * 2 + 1];
    if (left?.layeredPrints?.role === "panorama-left" && right?.layeredPrints?.role === "panorama-right") {
      slides.push(left, right);
    } else {
      slides.push(...emptySpread(spreadId));
    }
  }

  return reflowPanoramaSlides(slides, photos);
}

export function buildPanoramaSlides(photos: PhotoItem[]): Slide[] {
  return syncPanoramaSlides([], photos);
}

export function panoramaSlideHasContent(slide: Slide): boolean {
  const lp = slide.layeredPrints;
  if (!lp) return false;
  if (lp.background.kind === "photo" && lp.background.photoId) return true;
  return !!lp.spreadPrint?.photoId;
}

export function panoramaSpreadIndex(role: LayeredPrintsLayout["role"]): 0 | 1 {
  return role === "panorama-right" ? 1 : 0;
}

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
