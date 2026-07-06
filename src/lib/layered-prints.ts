import type { LayeredPrintsLayout, PhotoItem, Slide } from "./types";
import { uid } from "./utils";

type SlideRole = "hero" | "diptych" | "caption";

const DEFAULT_RECIPE: SlideRole[] = ["hero", "caption", "diptych", "diptych"];

function slideCells(...photoIds: string[]) {
  const seen = new Set<string>();
  const cells: { photoId: string }[] = [];
  for (const id of photoIds) {
    if (!seen.has(id)) {
      seen.add(id);
      cells.push({ photoId: id });
    }
  }
  return cells;
}

function heroSlide(bg: PhotoItem, print: PhotoItem): Slide {
  const layout: LayeredPrintsLayout = {
    background: { kind: "photo", photoId: bg.id },
    prints: [
      {
        photoId: print.id,
        xPct: 17.5,
        yPct: 18.9,
        wPct: 65,
        hPct: 62.2,
        shadow: true,
      },
    ],
  };
  return { id: uid(), cells: slideCells(bg.id, print.id), layeredPrints: layout };
}

function diptychSlide(bg: PhotoItem, p1: PhotoItem, p2: PhotoItem): Slide {
  const layout: LayeredPrintsLayout = {
    background: { kind: "photo", photoId: bg.id },
    prints: [
      { photoId: p1.id, xPct: 38, yPct: 42, wPct: 27, hPct: 55, shadow: true },
      { photoId: p2.id, xPct: 63, yPct: 40, wPct: 32, hPct: 60, shadow: true },
    ],
  };
  return { id: uid(), cells: slideCells(bg.id, p1.id, p2.id), layeredPrints: layout };
}

function captionSlide(p1: PhotoItem, p2: PhotoItem, caption: string): Slide {
  const layout: LayeredPrintsLayout = {
    background: { kind: "paper", color: "#ffffff" },
    prints: [
      { photoId: p1.id, xPct: 8, yPct: 5, wPct: 84, hPct: 38 },
      { photoId: p2.id, xPct: 8, yPct: 46, wPct: 84, hPct: 38 },
    ],
    caption,
  };
  return { id: uid(), cells: slideCells(p1.id, p2.id), layeredPrints: layout };
}

/** hero -> caption -> diptych -> diptych, cycling until photos run out. */
export function buildLayeredPrintsSlides(photos: PhotoItem[]): Slide[] {
  const slides: Slide[] = [];
  let i = 0;
  let recipeIdx = 0;

  while (i < photos.length) {
    const role = DEFAULT_RECIPE[recipeIdx % DEFAULT_RECIPE.length];
    recipeIdx++;

    if (role === "hero") {
      const bg = photos[i];
      const print = photos[i + 1] ?? bg;
      slides.push(heroSlide(bg, print));
      i += photos[i + 1] ? 2 : 1;
    } else if (role === "diptych") {
      const bg = photos[i];
      const p1 = photos[i + 1] ?? bg;
      const p2 = photos[i + 2] ?? p1;
      slides.push(diptychSlide(bg, p1, p2));
      i += Math.min(3, photos.length - i);
    } else {
      const p1 = photos[i];
      const p2 = photos[i + 1] ?? p1;
      slides.push(captionSlide(p1, p2, "YOUR CAPTION"));
      i += photos[i + 1] ? 2 : 1;
    }
  }

  return slides;
}
