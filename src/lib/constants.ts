export const MAX_PHOTOS = 10;

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT_PORTRAIT = 1350;
export const EXPORT_HEIGHT_SQUARE = 1080;

export type AspectRatio = "4:5" | "1:1";

export function exportHeight(aspect: AspectRatio): number {
  return aspect === "1:1" ? EXPORT_HEIGHT_SQUARE : EXPORT_HEIGHT_PORTRAIT;
}
