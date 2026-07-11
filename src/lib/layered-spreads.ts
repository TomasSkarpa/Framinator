import { DEFAULT_PHOTO_CROP } from "./constants";
import type {
  LayeredPrintsLayout,
  LayeredPrintsRole,
  PhotoItem,
  PrintLayer,
  Slide,
  SpreadPrintLayer,
  TemplateId,
} from "./types";
import { uid } from "./utils";

export const SPREAD_SLIDES_PER_SPREAD = 2;

export type LayeredSpreadTemplateId =
  | "layered-prints-panorama"
  | "layered-spread-scatter"
  | "layered-spread-cascade"
  | "layered-spread-corner"
  | "layered-spread-tilted"
  | "layered-spread-split";

export const LAYERED_SPREAD_TEMPLATE_IDS = new Set<TemplateId>([
  "layered-prints-panorama",
  "layered-spread-scatter",
  "layered-spread-cascade",
  "layered-spread-corner",
  "layered-spread-tilted",
  "layered-spread-split",
]);

export function isLayeredSpreadTemplate(
  templateId: TemplateId | null,
): templateId is LayeredSpreadTemplateId {
  return !!templateId && LAYERED_SPREAD_TEMPLATE_IDS.has(templateId);
}

function printSpec(
  photoId: string | undefined,
  spec: Omit<PrintLayer, "photoId">,
): PrintLayer {
  return photoId ? { photoId, ...spec } : { ...spec };
}

function spreadPrint(
  photoId: string | undefined,
  spec: Omit<SpreadPrintLayer, "photoId">,
): SpreadPrintLayer {
  return photoId ? { photoId, ...spec } : { ...spec };
}

type SpreadLayouts = [LayeredPrintsLayout, LayeredPrintsLayout];

type SpreadTemplateDef = {
  slotsPerSpread: number;
  leftRole: LayeredPrintsRole;
  rightRole: LayeredPrintsRole;
  buildSpreadLayouts: (spreadId: string, slotIds: (string | undefined)[]) => SpreadLayouts;
};

export function spreadIndexFromRole(role: LayeredPrintsRole): 0 | 1 {
  return role.endsWith("-right") ? 1 : 0;
}

export function cellsFromSpreadLayout(layout: LayeredPrintsLayout): { photoId: string }[] {
  const ids: string[] = [];
  const add = (id?: string) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  if (layout.background.kind === "photo") add(layout.background.photoId);
  for (const p of layout.prints) add(p.photoId);
  if (layout.spreadPrint?.photoId) add(layout.spreadPrint.photoId);
  return ids.map((photoId) => ({ photoId }));
}

export function spreadSlideHasContent(slide: Slide): boolean {
  const lp = slide.layeredPrints;
  if (!lp) return false;
  if (lp.background.kind === "photo" && lp.background.photoId) return true;
  if (lp.spreadPrint?.photoId) return true;
  return lp.prints.some((p) => !!p.photoId);
}

export const PANORAMA_OVERLAY_SPEC: Omit<SpreadPrintLayer, "photoId"> = {
  spreadXPct: 22,
  yPct: 55,
  spreadWPct: 156,
  hPct: 31,
  rotationDeg: -2,
  shadow: true,
};

const CORNER_BLEED_SPEC: Omit<SpreadPrintLayer, "photoId"> = {
  spreadXPct: 54,
  yPct: -7,
  spreadWPct: 122,
  hPct: 70,
  rotationDeg: -3,
  shadow: true,
};

const SPREAD_DEFS: Record<string, SpreadTemplateDef> = {
  "layered-prints-panorama": {
    slotsPerSpread: 3,
    leftRole: "panorama-left",
    rightRole: "panorama-right",
    buildSpreadLayouts(spreadId, [bgLeft, overlay, bgRight]) {
      return [
        {
          role: "panorama-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrint: spreadPrint(overlay, PANORAMA_OVERLAY_SPEC),
        },
        {
          role: "panorama-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrint: spreadPrint(overlay, PANORAMA_OVERLAY_SPEC),
        },
      ];
    },
  },
  "layered-spread-scatter": {
    slotsPerSpread: 6,
    leftRole: "scatter-left",
    rightRole: "scatter-right",
    buildSpreadLayouts(spreadId, [bgLeft, bgRight, p1, p2, p3, p4]) {
      return [
        {
          role: "scatter-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [
            printSpec(p1, {
              xPct: -6,
              yPct: 9,
              wPct: 50,
              hPct: 43,
              rotationDeg: -7,
              shadow: true,
            }),
            printSpec(p2, {
              xPct: 51,
              yPct: 25,
              wPct: 47,
              hPct: 54,
              rotationDeg: 5,
              shadow: true,
            }),
          ],
        },
        {
          role: "scatter-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [
            printSpec(p3, {
              xPct: -9,
              yPct: 48,
              wPct: 52,
              hPct: 43,
              rotationDeg: 8,
              shadow: true,
            }),
            printSpec(p4, {
              xPct: 48,
              yPct: 4,
              wPct: 55,
              hPct: 40,
              rotationDeg: -5,
              shadow: true,
            }),
          ],
        },
      ];
    },
  },
  "layered-spread-cascade": {
    slotsPerSpread: 5,
    leftRole: "cascade-left",
    rightRole: "cascade-right",
    buildSpreadLayouts(spreadId, [bgLeft, p1, bgRight, p2, p3]) {
      return [
        {
          role: "cascade-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [
            printSpec(p1, {
              xPct: 9,
              yPct: 4,
              wPct: 62,
              hPct: 48,
              rotationDeg: -6,
              shadow: true,
            }),
          ],
        },
        {
          role: "cascade-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [
            printSpec(p2, {
              xPct: -12,
              yPct: 35,
              wPct: 55,
              hPct: 42,
              rotationDeg: 5,
              shadow: true,
            }),
            printSpec(p3, {
              xPct: 45,
              yPct: 70,
              wPct: 46,
              hPct: 26,
              rotationDeg: -4,
              shadow: true,
            }),
          ],
        },
      ];
    },
  },
  "layered-spread-corner": {
    slotsPerSpread: 4,
    leftRole: "corner-left",
    rightRole: "corner-right",
    buildSpreadLayouts(spreadId, [bgLeft, bleed, bgRight, peek]) {
      return [
        {
          role: "corner-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrint: spreadPrint(bleed, CORNER_BLEED_SPEC),
        },
        {
          role: "corner-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [
            printSpec(peek, {
              xPct: -6,
              yPct: 69,
              wPct: 56,
              hPct: 38,
              rotationDeg: 6,
              shadow: true,
            }),
          ],
          spreadPrint: spreadPrint(bleed, CORNER_BLEED_SPEC),
        },
      ];
    },
  },
  "layered-spread-tilted": {
    slotsPerSpread: 5,
    leftRole: "tilted-left",
    rightRole: "tilted-right",
    buildSpreadLayouts(spreadId, [bgLeft, bgRight, p1, p2, p3]) {
      return [
        {
          role: "tilted-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [
            printSpec(p1, {
              xPct: 8,
              yPct: 32,
              wPct: 64,
              hPct: 54,
              rotationDeg: -7,
              shadow: true,
            }),
            printSpec(p2, {
              xPct: 55,
              yPct: 13,
              wPct: 38,
              hPct: 33,
              rotationDeg: 8,
              shadow: true,
            }),
          ],
        },
        {
          role: "tilted-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [
            printSpec(p3, {
              xPct: -10,
              yPct: 40,
              wPct: 60,
              hPct: 48,
              rotationDeg: -5,
              shadow: true,
            }),
          ],
        },
      ];
    },
  },
  "layered-spread-split": {
    slotsPerSpread: 6,
    leftRole: "split-left",
    rightRole: "split-right",
    buildSpreadLayouts(spreadId, [bgLeft, hero, bgRight, s1, s2, s3]) {
      return [
        {
          role: "split-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [
            printSpec(hero, {
              xPct: -2,
              yPct: 12,
              wPct: 88,
              hPct: 72,
              rotationDeg: -2,
              shadow: true,
            }),
          ],
        },
        {
          role: "split-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [
            printSpec(s1, {
              xPct: -8,
              yPct: 12,
              wPct: 50,
              hPct: 32,
              rotationDeg: 6,
              shadow: true,
            }),
            printSpec(s2, {
              xPct: 45,
              yPct: 44,
              wPct: 46,
              hPct: 37,
              rotationDeg: -4,
              shadow: true,
            }),
            printSpec(s3, {
              xPct: 20,
              yPct: 76,
              wPct: 40,
              hPct: 22,
              rotationDeg: 3,
              shadow: true,
            }),
          ],
        },
      ];
    },
  },
};

function spreadDef(templateId: LayeredSpreadTemplateId): SpreadTemplateDef {
  const def = SPREAD_DEFS[templateId];
  if (!def) throw new Error(`Unknown spread template: ${templateId}`);
  return def;
}

function spreadCountForPhotos(templateId: LayeredSpreadTemplateId, photoCount: number): number {
  const { slotsPerSpread } = spreadDef(templateId);
  return Math.max(1, Math.ceil(photoCount / slotsPerSpread));
}

function emptySpread(templateId: LayeredSpreadTemplateId, spreadId: string): [Slide, Slide] {
  const def = spreadDef(templateId);
  const [left, right] = def.buildSpreadLayouts(spreadId, []);
  return [
    { id: uid(), cells: [], layeredPrints: left },
    { id: uid(), cells: [], layeredPrints: right },
  ];
}

export function reflowSpreadSlides(
  templateId: LayeredSpreadTemplateId,
  slides: Slide[],
  photos: PhotoItem[],
): Slide[] {
  const def = spreadDef(templateId);
  const photoIds = photos.map((p) => p.id);
  let idx = 0;
  const out: Slide[] = [];

  for (let i = 0; i < slides.length; i += SPREAD_SLIDES_PER_SPREAD) {
    const left = slides[i];
    const right = slides[i + 1];
    const spreadId =
      left?.layeredPrints?.spreadId ?? right?.layeredPrints?.spreadId ?? uid();
    const slots: (string | undefined)[] = [];
    for (let s = 0; s < def.slotsPerSpread; s++) {
      slots.push(photoIds[idx]);
      if (photoIds[idx]) idx++;
    }
    const [leftLayout, rightLayout] = def.buildSpreadLayouts(spreadId, slots);

    if (left) {
      out.push({ ...left, layeredPrints: leftLayout, cells: cellsFromSpreadLayout(leftLayout) });
    }
    if (right) {
      out.push({ ...right, layeredPrints: rightLayout, cells: cellsFromSpreadLayout(rightLayout) });
    }
  }

  return out;
}

export function syncSpreadSlides(
  templateId: LayeredSpreadTemplateId,
  existing: Slide[],
  photos: PhotoItem[],
): Slide[] {
  const def = spreadDef(templateId);
  const spreads = spreadCountForPhotos(templateId, photos.length);
  const slides: Slide[] = [];

  for (let s = 0; s < spreads; s++) {
    const spreadId = existing[s * 2]?.layeredPrints?.spreadId ?? uid();
    const left = existing[s * 2];
    const right = existing[s * 2 + 1];
    if (
      left?.layeredPrints?.role === def.leftRole &&
      right?.layeredPrints?.role === def.rightRole
    ) {
      slides.push(left, right);
    } else {
      slides.push(...emptySpread(templateId, spreadId));
    }
  }

  return reflowSpreadSlides(templateId, slides, photos);
}

export function buildSpreadSlides(
  templateId: LayeredSpreadTemplateId,
  photos: PhotoItem[],
): Slide[] {
  return syncSpreadSlides(templateId, [], photos);
}

// ponytail: dev-only guard for scatter slotting
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const built = buildSpreadSlides("layered-spread-scatter", [
    { id: "a", name: "a", objectUrl: "", crop: { offsetX: 0, offsetY: 0, scale: 1 } },
    { id: "b", name: "b", objectUrl: "", crop: { offsetX: 0, offsetY: 0, scale: 1 } },
    { id: "c", name: "c", objectUrl: "", crop: { offsetX: 0, offsetY: 0, scale: 1 } },
    { id: "d", name: "d", objectUrl: "", crop: { offsetX: 0, offsetY: 0, scale: 1 } },
    { id: "e", name: "e", objectUrl: "", crop: { offsetX: 0, offsetY: 0, scale: 1 } },
    { id: "f", name: "f", objectUrl: "", crop: { offsetX: 0, offsetY: 0, scale: 1 } },
  ]);
  const left = built[0].layeredPrints;
  if (left?.role !== "scatter-left" || left.prints.length !== 2) {
    throw new Error("scatter self-check: layout broken");
  }
}
