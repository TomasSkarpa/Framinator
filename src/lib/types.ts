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
  | "kodak-strip";

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

export type Slide = {
  id: string;
  cells: SlideCell[];
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
