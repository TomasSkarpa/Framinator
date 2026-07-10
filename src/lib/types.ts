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
  | "layered-prints-panorama"
  | "layered-spread-scatter"
  | "layered-spread-cascade"
  | "layered-spread-corner"
  | "layered-spread-tilted"
  | "layered-spread-split"
  | "soft-focus"
  | "mdc-editorial-poster-frame"
  | "mdc-red-bracket-system"
  | "mdc-floating-caption-bar"
  | "mdc-white-logo-red-shadow"
  | "mdc-gradient-footer-takeover"
  | "mdc-red-duotone-split"
  | "mdc-conference-masthead"
  | "mdc-repeating-event-spine"
  | "mdc-diagonal-campaign-wrap"
  | "mdc-black-lower-third-plate"
  | "mdc-sharp-red-corner-wedge"
  | "mdc-right-side-brand-slab"
  | "mdc-repeating-logo-texture"
  | "mdc-oversized-translucent-mark"
  | "mdc-monochrome-red-footer-fade";

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

export type LayeredPrintsRole =
  | "hero"
  | "diptych"
  | "caption"
  | "panorama-left"
  | "panorama-right"
  | "scatter-left"
  | "scatter-right"
  | "cascade-left"
  | "cascade-right"
  | "corner-left"
  | "corner-right"
  | "tilted-left"
  | "tilted-right"
  | "split-left"
  | "split-right";

/** Overlay spanning a 2-slide spread; x/w are % of one slide width (spread spans 0–200). */
export type SpreadPrintLayer = {
  photoId?: string;
  spreadXPct: number;
  yPct: number;
  spreadWPct: number;
  hPct: number;
  rotationDeg?: number;
  borderPx?: number;
  borderColor?: string;
  shadow?: boolean;
};

export type LayeredPrintsBackground =
  | { kind: "photo"; photoId?: string }
  | { kind: "paper"; color: string };

export type LayeredPrintsLayout = {
  role: LayeredPrintsRole;
  background: LayeredPrintsBackground;
  prints: PrintLayer[];
  spreadId?: string;
  spreadPrint?: SpreadPrintLayer;
  caption?: string;
};

export type Slide = {
  id: string;
  cells: SlideCell[];
  layeredPrints?: LayeredPrintsLayout;
  /** MDC marketing templates: branded frame on this slide when true. */
  overlayEnabled?: boolean;
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
