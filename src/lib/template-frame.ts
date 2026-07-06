import type { AspectRatio } from "./constants";
import type { TemplateId } from "./types";

/** Kodak strip inner film window (matches canvas-render). */
export const KODAK_FRAME_ASPECT = 640 / 900;

/** Visible photo area per template for smart-layout crop hints. */
export function smartLayoutFrameContext(
  templateId: TemplateId | null,
  aspectRatio: AspectRatio,
): string {
  const slideAspect = aspectRatio === "1:1" ? "1:1 square" : "4:5 portrait";

  if (!templateId) {
    return `Slide aspect: ${slideAspect}. One photo fills each slide.`;
  }

  switch (templateId) {
    case "kodak-strip":
      return (
        `Photo area: vertical film frame inside the slide, aspect width:height ≈ ${KODAK_FRAME_ASPECT.toFixed(4)} ` +
        `(tall narrow window). Crop so faces and bodies fit this window, not the full slide.`
      );
    case "framed-polaroid":
      return `Photo area: inset polaroid window (~85% of slide width, centered). Slide aspect: ${slideAspect}.`;
    case "clean-carousel":
      return `Photo area: full bleed slide, aspect ${slideAspect}.`;
    default:
      return `Template "${templateId}": crop for the visible photo window on each slide (${slideAspect}).`;
  }
}

// ponytail: dev-only guard
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const kodak = smartLayoutFrameContext("kodak-strip", "4:5");
  if (!kodak.includes("640") && !kodak.includes("0.7111")) {
    throw new Error("template-frame self-check: kodak aspect missing");
  }
}
