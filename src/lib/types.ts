import type { AspectRatio } from "./constants";

export type FilterPreset =
  | "none"
  | "astia"
  | "velvia"
  | "fp100c"
  | "elite-chrome"
  | "xpro"
  | "superia";

export type TemplateId =
  | "grid-split"
  | "framed-polaroid"
  | "clean-carousel"
  | "story-arc";

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
  /** Grid-split: which third of the composite row (0, 1, 2) */
  gridColumn?: number;
  /** Story arc: layout variant */
  variant?: "cover" | "full" | "inset";
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
