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
    case "layered-prints":
      return (
        `Template "${templateId}": layered snapshot scene. Crops may be used as full-slide blurred/background photos ` +
        `or as smaller paper prints. Put the important subject away from print edges and leave enough surrounding context ` +
        `for tilted or overlapping snapshots.`
      );
    case "layered-prints-panorama":
      return (
        `Template "${templateId}": two-slide panorama spread with roles panorama-left and panorama-right. ` +
        `One overlay photo spans both slides in a wide horizontal print, ` +
        `crossing the center seam. Crop wide subjects so the important content stays visible inside that horizontal ` +
        `panorama band and is not lost at the left/right slide edges or the seam. Background photos still fill full slides.`
      );
    case "layered-spread-scatter":
      return (
        `Template "${templateId}": two-slide scatter spread with paper prints that can cross the center seam. ` +
        `Crop each print for its own small rectangular window, keeping faces/products centered with extra margin because ` +
        `prints overlap and sit in different left/right spread roles. Background photos fill a full ${slideAspect} slide.`
      );
    case "layered-spread-cascade":
      return (
        `Template "${templateId}": two-slide cascade spread with stepped paper prints crossing both slides. ` +
        `Crop foreground prints tightly enough to read in smaller frames, but keep faces and key objects away from edges. ` +
        `Background photos fill a full ${slideAspect} slide.`
      );
    case "layered-spread-corner":
      return (
        `Template "${templateId}": two-slide corner bleed spread. A large photo can bleed across the upper/right corner ` +
        `of both slides, with an additional smaller print near the lower corner. Crop the bleed photo for a large partial ` +
        `window and keep the main subject visible across the seam; crop the small print as a compact detail frame.`
      );
    case "layered-spread-tilted":
      return (
        `Template "${templateId}": two-slide tilted pile spread. Rotated prints flow across both slides over ` +
        `full-slide backgrounds. Crop print photos with generous face/object margin because rotation trims corners; ` +
        `background photos fill a full ${slideAspect} slide.`
      );
    case "layered-spread-split":
      return (
        `Template "${templateId}": two-slide split focus spread. One large hero print dominates the left slide and ` +
        `several small detail prints sit on the right. Put the strongest subject in the hero crop and use tighter, ` +
        `simple crops for the smaller detail frames. Background photos fill full slides.`
      );
    case "soft-focus":
      return (
        `Template "${templateId}": blurred full-slide backdrop plus a centered framed foreground photo. ` +
        `Crop for the foreground photo first so the subject is sharp and centered; backdrop crop can be looser because ` +
        `it is blurred and mainly provides color/context.`
      );
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
