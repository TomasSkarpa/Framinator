import type {
  LayeredPrintsLayout,
  LayeredPrintsRole,
  PhotoItem,
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
  for (const p of spreadPrintsForLayout(layout)) add(p.photoId);
  return ids.map((photoId) => ({ photoId }));
}

/** Includes the legacy singular field so previously saved projects still render. */
export function spreadPrintsForLayout(layout: LayeredPrintsLayout): SpreadPrintLayer[] {
  return [...(layout.spreadPrint ? [layout.spreadPrint] : []), ...(layout.spreadPrints ?? [])];
}

export function spreadSlideHasContent(slide: Slide): boolean {
  const lp = slide.layeredPrints;
  if (!lp) return false;
  if (lp.background.kind === "photo" && lp.background.photoId) return true;
  if (spreadPrintsForLayout(lp).some((p) => !!p.photoId)) return true;
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
    buildSpreadLayouts(spreadId, [overlay, bgLeft, bgRight]) {
      const spreadPrints = [spreadPrint(overlay, PANORAMA_OVERLAY_SPEC)];
      return [
        {
          role: "panorama-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrints,
        },
        {
          role: "panorama-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrints,
        },
      ];
    },
  },
  "layered-spread-scatter": {
    slotsPerSpread: 6,
    leftRole: "scatter-left",
    rightRole: "scatter-right",
    buildSpreadLayouts(spreadId, [p1, p2, p3, p4, bgLeft, bgRight]) {
      const spreadPrints = [
        spreadPrint(p1, {
          spreadXPct: -6,
          yPct: 9,
          spreadWPct: 50,
          hPct: 43,
          rotationDeg: -7,
          shadow: true,
        }),
        spreadPrint(p2, {
          spreadXPct: 60,
          yPct: 25,
          spreadWPct: 55,
          hPct: 54,
          rotationDeg: 5,
          shadow: true,
        }),
        spreadPrint(p3, {
          spreadXPct: 93,
          yPct: 48,
          spreadWPct: 56,
          hPct: 43,
          rotationDeg: 8,
          shadow: true,
        }),
        spreadPrint(p4, {
          spreadXPct: 148,
          yPct: 4,
          spreadWPct: 55,
          hPct: 40,
          rotationDeg: -5,
          shadow: true,
        }),
      ];
      return [
        {
          role: "scatter-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrints,
        },
        {
          role: "scatter-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrints,
        },
      ];
    },
  },
  "layered-spread-cascade": {
    slotsPerSpread: 5,
    leftRole: "cascade-left",
    rightRole: "cascade-right",
    buildSpreadLayouts(spreadId, [p1, p2, p3, bgLeft, bgRight]) {
      const spreadPrints = [
        spreadPrint(p1, {
          spreadXPct: 9,
          yPct: 4,
          spreadWPct: 62,
          hPct: 48,
          rotationDeg: -6,
          shadow: true,
        }),
        spreadPrint(p2, {
          spreadXPct: 72,
          yPct: 35,
          spreadWPct: 60,
          hPct: 42,
          rotationDeg: 5,
          shadow: true,
        }),
        spreadPrint(p3, {
          spreadXPct: 145,
          yPct: 70,
          spreadWPct: 48,
          hPct: 26,
          rotationDeg: -4,
          shadow: true,
        }),
      ];
      return [
        {
          role: "cascade-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrints,
        },
        {
          role: "cascade-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrints,
        },
      ];
    },
  },
  "layered-spread-corner": {
    slotsPerSpread: 4,
    leftRole: "corner-left",
    rightRole: "corner-right",
    buildSpreadLayouts(spreadId, [bleed, peek, bgLeft, bgRight]) {
      const spreadPrints = [
        spreadPrint(bleed, CORNER_BLEED_SPEC),
        spreadPrint(peek, {
          spreadXPct: 92,
          yPct: 69,
          spreadWPct: 56,
          hPct: 38,
          rotationDeg: 6,
          shadow: true,
        }),
      ];
      return [
        {
          role: "corner-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrints,
        },
        {
          role: "corner-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrints,
        },
      ];
    },
  },
  "layered-spread-tilted": {
    slotsPerSpread: 5,
    leftRole: "tilted-left",
    rightRole: "tilted-right",
    buildSpreadLayouts(spreadId, [p1, p2, p3, bgLeft, bgRight]) {
      const spreadPrints = [
        spreadPrint(p1, {
          spreadXPct: 8,
          yPct: 32,
          spreadWPct: 64,
          hPct: 54,
          rotationDeg: -7,
          shadow: true,
        }),
        spreadPrint(p2, {
          spreadXPct: 68,
          yPct: 13,
          spreadWPct: 60,
          hPct: 33,
          rotationDeg: 8,
          shadow: true,
        }),
        spreadPrint(p3, {
          spreadXPct: 136,
          yPct: 40,
          spreadWPct: 60,
          hPct: 48,
          rotationDeg: -5,
          shadow: true,
        }),
      ];
      return [
        {
          role: "tilted-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrints,
        },
        {
          role: "tilted-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrints,
        },
      ];
    },
  },
  "layered-spread-split": {
    slotsPerSpread: 6,
    leftRole: "split-left",
    rightRole: "split-right",
    buildSpreadLayouts(spreadId, [hero, s1, s2, s3, bgLeft, bgRight]) {
      const spreadPrints = [
        spreadPrint(hero, {
          spreadXPct: -2,
          yPct: 12,
          spreadWPct: 88,
          hPct: 72,
          rotationDeg: -2,
          shadow: true,
        }),
        spreadPrint(s1, {
          spreadXPct: 76,
          yPct: 12,
          spreadWPct: 50,
          hPct: 32,
          rotationDeg: 6,
          shadow: true,
        }),
        spreadPrint(s2, {
          spreadXPct: 128,
          yPct: 44,
          spreadWPct: 46,
          hPct: 37,
          rotationDeg: -4,
          shadow: true,
        }),
        spreadPrint(s3, {
          spreadXPct: 98,
          yPct: 76,
          spreadWPct: 40,
          hPct: 22,
          rotationDeg: 3,
          shadow: true,
        }),
      ];
      return [
        {
          role: "split-left",
          spreadId,
          background: { kind: "photo", photoId: bgLeft },
          prints: [],
          spreadPrints,
        },
        {
          role: "split-right",
          spreadId,
          background: { kind: "photo", photoId: bgRight },
          prints: [],
          spreadPrints,
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

// ponytail: dev-only guard for foreground-first spread slotting
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const foregroundCounts: [LayeredSpreadTemplateId, number][] = [
    ["layered-prints-panorama", 1],
    ["layered-spread-scatter", 4],
    ["layered-spread-cascade", 3],
    ["layered-spread-corner", 2],
    ["layered-spread-tilted", 3],
    ["layered-spread-split", 4],
  ];
  for (const [templateId, count] of foregroundCounts) {
    const photos = Array.from({ length: count }, (_, i) => ({
      id: `${templateId}-${i}`,
      name: `${templateId}-${i}`,
      objectUrl: "",
      crop: { offsetX: 0, offsetY: 0, scale: 1 },
    }));
    const [left, right] = buildSpreadSlides(templateId, photos);
    const leftLayout = left?.layeredPrints;
    const rightLayout = right?.layeredPrints;
    const spreadPrints = leftLayout ? spreadPrintsForLayout(leftLayout) : [];
    if (
      leftLayout?.background.kind !== "photo" ||
      leftLayout.background.photoId ||
      rightLayout?.background.kind !== "photo" ||
      rightLayout.background.photoId ||
      spreadPrints.filter((p) => !!p.photoId).length !== count ||
      !spreadPrints.some(
        (p) => !!p.photoId && p.spreadXPct < 100 && p.spreadXPct + p.spreadWPct > 100,
      )
    ) {
      throw new Error(`${templateId} self-check: foreground-first slotting broken`);
    }
  }
}
