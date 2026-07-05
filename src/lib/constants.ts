export const MAX_PHOTOS = 10;

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT_PORTRAIT = 1350;
export const EXPORT_HEIGHT_SQUARE = 1080;

export type AspectRatio = "4:5" | "1:1";

export function exportHeight(aspect: AspectRatio): number {
  return aspect === "1:1" ? EXPORT_HEIGHT_SQUARE : EXPORT_HEIGHT_PORTRAIT;
}

/** crop.scale: 1 = fill frame (cover). Below 1 zooms out; above 1 zooms in. */
export const CROP_SCALE_MIN = 0.25;
export const CROP_SCALE_MAX = 2;
export const CROP_SCALE_DEFAULT = 1;

export const DEFAULT_PHOTO_CROP = {
  offsetX: 0,
  offsetY: 0,
  scale: CROP_SCALE_DEFAULT,
} as const;
