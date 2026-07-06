import type { LayeredPrintsLayout, LayeredPrintsRole, PhotoItem, PrintLayer, Slide } from "./types";
import { uid } from "./utils";

export type { LayeredPrintsRole };

export const LAYERED_PRINTS_RECIPE: LayeredPrintsRole[] = [
  "hero",
  "caption",
  "diptych",
  "diptych",
];

const CAPTION_TEXT = "YOUR CAPTION";

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

function heroLayout(bgId?: string, printId?: string): LayeredPrintsLayout {
  return {
    role: "hero",
    background: { kind: "photo", photoId: bgId },
    prints: [
      printSpec(printId, {
        xPct: 17.5,
        yPct: 18.9,
        wPct: 65,
        hPct: 62.2,
        shadow: true,
      }),
    ],
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
    caption: CAPTION_TEXT,
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

/** Grow slide roles until there are enough frames for every photo. */
export function rolesForPhotoCount(
  existing: LayeredPrintsRole[],
  photoCount: number,
): LayeredPrintsRole[] {
  const roles = existing.length > 0 ? [...existing] : [LAYERED_PRINTS_RECIPE[0]];
  let recipeIdx = roles.length;
  while (totalSlots(roles) < photoCount) {
    roles.push(LAYERED_PRINTS_RECIPE[recipeIdx % LAYERED_PRINTS_RECIPE.length]);
    recipeIdx++;
  }
  return roles;
}

/** Walk photos in order into slide frames (slide order = recipe order). */
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

/** Add slides / reflow photos. Preserves slide ids and order on reorder. */
export function syncLayeredPrintsSlides(existing: Slide[], photos: PhotoItem[]): Slide[] {
  const roles = rolesForPhotoCount(
    existing.map((s) => s.layeredPrints?.role).filter((r): r is LayeredPrintsRole => !!r),
    photos.length,
  );
  const slides = roles.map((role, i) => {
    const prior = existing[i];
    if (prior?.layeredPrints?.role === role) return prior;
    return emptySlide(prior?.id ?? uid(), role);
  });
  return reflowLayeredPrintsSlides(slides, photos);
}

export function buildLayeredPrintsSlides(photos: PhotoItem[]): Slide[] {
  if (photos.length === 0) return [];
  return syncLayeredPrintsSlides([], photos);
}
