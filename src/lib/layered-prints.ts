import type { LayeredPrintsLayout, LayeredPrintsRole, PhotoItem, PrintLayer, Slide } from "./types";
import { DEFAULT_PHOTO_CROP } from "./constants";
import { uid } from "./utils";

export type { LayeredPrintsRole };

export const LAYERED_PRINTS_RECIPE: LayeredPrintsRole[] = [
  "hero",
  "caption",
  "diptych",
  "diptych",
];

function slotsForRole(role: LayeredPrintsRole): number {
  if (role === "hero") return 2;
  if (role === "diptych") return 3;
  return 2;
}

function totalSlots(roles: LayeredPrintsRole[]): number {
  return roles.reduce((n, r) => n + slotsForRole(r), 0);
}

function printSpec(
  photoId: string | undefined,
  spec: Omit<PrintLayer, "photoId">,
): PrintLayer {
  return photoId ? { photoId, ...spec } : { ...spec };
}

/** Centered white-bordered print used on hero layered-prints slides and soft-focus. */
export const HERO_PRINT_FRAME: Omit<PrintLayer, "photoId"> = {
  xPct: 17.5,
  yPct: 18.9,
  wPct: 65,
  hPct: 62.2,
  shadow: true,
};

function heroLayout(bgId?: string, printId?: string): LayeredPrintsLayout {
  return {
    role: "hero",
    background: { kind: "photo", photoId: bgId },
    prints: [printSpec(printId, HERO_PRINT_FRAME)],
  };
}

function diptychLayout(bgId?: string, p1Id?: string, p2Id?: string): LayeredPrintsLayout {
  return {
    role: "diptych",
    background: { kind: "photo", photoId: bgId },
    prints: [
      printSpec(p1Id, { xPct: 38, yPct: 42, wPct: 27, hPct: 55, shadow: true }),
      printSpec(p2Id, {
        xPct: 63,
        yPct: 40,
        wPct: 32,
        hPct: 60,
        shadow: true,
      }),
    ],
  };
}

function captionLayout(p1Id?: string, p2Id?: string): LayeredPrintsLayout {
  return {
    role: "caption",
    background: { kind: "paper", color: "#ffffff" },
    prints: [
      printSpec(p1Id, { xPct: 8, yPct: 5, wPct: 84, hPct: 38 }),
      printSpec(p2Id, { xPct: 8, yPct: 46, wPct: 84, hPct: 38 }),
    ],
  };
}

function layoutForRole(role: LayeredPrintsRole, slotIds: (string | undefined)[]): LayeredPrintsLayout {
  if (role === "hero") return heroLayout(slotIds[0], slotIds[1]);
  if (role === "diptych") return diptychLayout(slotIds[0], slotIds[1], slotIds[2]);
  return captionLayout(slotIds[0], slotIds[1]);
}

export function cellsFromLayeredLayout(layout: LayeredPrintsLayout): { photoId: string }[] {
  const ids: string[] = [];
  const add = (id?: string) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  if (layout.background.kind === "photo") add(layout.background.photoId);
  for (const p of layout.prints) add(p.photoId);
  return ids.map((photoId) => ({ photoId }));
}

function emptySlide(id: string, role: LayeredPrintsRole): Slide {
  const layout = layoutForRole(role, []);
  return { id, cells: [], layeredPrints: layout };
}

/** Full recipe cycle with dashed placeholders (no photos assigned). */
export function createRecipeSlides(roles: LayeredPrintsRole[] = LAYERED_PRINTS_RECIPE): Slide[] {
  return roles.map((role) => emptySlide(uid(), role));
}

function rolesFromExisting(existing: Slide[]): LayeredPrintsRole[] {
  const roles = existing
    .map((s) => s.layeredPrints?.role)
    .filter((r): r is LayeredPrintsRole => !!r);
  return roles.length > 0 ? roles : [...LAYERED_PRINTS_RECIPE];
}

/** Grow slide roles until there are enough frames for every photo; always at least one recipe cycle. */
export function rolesForPhotoCount(
  existing: LayeredPrintsRole[],
  photoCount: number,
): LayeredPrintsRole[] {
  const roles = existing.length > 0 ? [...existing] : [...LAYERED_PRINTS_RECIPE];
  let recipeIdx = roles.length;
  while (totalSlots(roles) < photoCount) {
    roles.push(LAYERED_PRINTS_RECIPE[recipeIdx % LAYERED_PRINTS_RECIPE.length]);
    recipeIdx++;
  }
  return roles;
}

/** Walk tray photos in order into slide frames (slide order unchanged). */
export function reflowLayeredPrintsSlides(slides: Slide[], photos: PhotoItem[]): Slide[] {
  const photoIds = photos.map((p) => p.id);
  let idx = 0;

  return slides.map((slide) => {
    const role = slide.layeredPrints?.role ?? "hero";
    const count = slotsForRole(role);
    const slotIds: (string | undefined)[] = [];
    for (let s = 0; s < count; s++) {
      slotIds.push(photoIds[idx]);
      if (photoIds[idx]) idx++;
    }
    const layout = layoutForRole(role, slotIds);
    const cells = cellsFromLayeredLayout(layout);
    return { ...slide, layeredPrints: layout, cells };
  });
}

/** Extend slide list if needed, then reflow photos. Preserves slide ids and carousel order. */
export function syncLayeredPrintsSlides(existing: Slide[], photos: PhotoItem[]): Slide[] {
  const existingRoles = rolesFromExisting(existing);
  const roles = rolesForPhotoCount(existingRoles, photos.length);
  const slides = roles.map((role, i) => {
    const prior = existing[i];
    if (prior?.layeredPrints?.role === role) return prior;
    return emptySlide(prior?.id ?? uid(), role);
  });
  return reflowLayeredPrintsSlides(slides, photos);
}

export function buildLayeredPrintsSlides(photos: PhotoItem[]): Slide[] {
  return syncLayeredPrintsSlides([], photos);
}

/** True when at least one frame on the slide has a photo (export skips empty slides). */
export function layeredPrintsSlideHasContent(slide: Slide): boolean {
  const lp = slide.layeredPrints;
  if (!lp) return false;
  if (lp.background.kind === "photo" && lp.background.photoId) return true;
  return lp.prints.some((p) => p.photoId);
}

// ponytail: dev-only guard; fails if slide reorder incorrectly reflows photos
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const stub = (id: string): PhotoItem => ({
    id,
    name: id,
    objectUrl: "",
    crop: { ...DEFAULT_PHOTO_CROP },
  });
  const photos = [stub("a"), stub("b"), stub("c"), stub("d")];
  const built = buildLayeredPrintsSlides(photos);
  const captionIdx = built.findIndex((s) => s.layeredPrints?.role === "caption");
  const captionPhotos = built[captionIdx]?.layeredPrints?.prints.map((p) => p.photoId);
  const swapped = [...built];
  [swapped[0], swapped[captionIdx]] = [swapped[captionIdx], swapped[0]];
  const stickyBg = swapped[0].layeredPrints?.prints[0]?.photoId;
  if (stickyBg !== captionPhotos?.[0]) {
    throw new Error("layered-prints self-check: sticky slide reorder broken");
  }
  const reflowed = reflowLayeredPrintsSlides(built, [stub("d"), stub("c"), stub("b"), stub("a")]);
  const heroBg = reflowed[0].layeredPrints?.background;
  if (heroBg?.kind !== "photo" || heroBg.photoId !== "d") {
    throw new Error("layered-prints self-check: photo tray reorder reflow broken");
  }
}
