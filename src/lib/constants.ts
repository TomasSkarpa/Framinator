export const MAX_PHOTOS = 10;

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT_PORTRAIT = 1350;
export const EXPORT_HEIGHT_SQUARE = 1080;

export type AspectRatio = "4:5" | "1:1";

export function exportHeight(aspect: AspectRatio): number {
  return aspect === "1:1" ? EXPORT_HEIGHT_SQUARE : EXPORT_HEIGHT_PORTRAIT;
}

export const FILTER_CSS: Record<string, string> = {
  none: "none",
  warm: "sepia(0.25) saturate(1.2) brightness(1.05)",
  cool: "saturate(0.9) hue-rotate(15deg) brightness(1.02)",
  bw: "grayscale(1) contrast(1.05)",
  vintage: "sepia(0.45) contrast(0.95) brightness(0.98)",
};
