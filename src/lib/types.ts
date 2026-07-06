import type { AspectRatio } from "./constants";

export type FilterPreset =
  | "none"
  | "astia"
  | "velvia"
  | "velvia-50"
  | "provia"
  | "fp100c"
  | "elite-chrome"
  | "xpro"
  | "superia"
  | "kodachrome"
  | "agfa-precisa"
  | "polaroid-669"
  | "portra-400"
  | "pro-400h"
  | "classic-chrome"
  | "acros"
  | "kodak-2383"
  | "fuji-3513";

export type TemplateId =
  | "framed-polaroid"
  | "clean-carousel"
  | "kodak-strip"
  | "layered-prints"
  | "soft-focus";

export type PhotoCrop = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type PhotoItem = {
  id: string;
  name: string;
  objectUrl: string;
  crop: PhotoCrop;
  /** Transient File handle for IndexedDB autosave; not persisted in state shape */
  _file?: File;
};

export type SlideCell = {
  photoId: string;
};

/** White-bordered print on a layered-prints slide (% of canvas). */
export type PrintLayer = {
  photoId?: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  rotationDeg?: number;
  borderPx?: number;
  borderColor?: string;
  shadow?: boolean;
};

export type LayeredPrintsRole = "hero" | "diptych" | "caption";

export type LayeredPrintsBackground =
  | { kind: "photo"; photoId?: string }
  | { kind: "paper"; color: string };

export type LayeredPrintsLayout = {
  role: LayeredPrintsRole;
  background: LayeredPrintsBackground;
  prints: PrintLayer[];
  caption?: string;
};

export type Slide = {
  id: string;
  cells: SlideCell[];
  layeredPrints?: LayeredPrintsLayout;
};

export type ProjectState = {
  photos: PhotoItem[];
  templateId: TemplateId | null;
  slides: Slide[];
  filter: FilterPreset;
  borderWidth: number;
  aspectRatio: AspectRatio;
};

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
};
