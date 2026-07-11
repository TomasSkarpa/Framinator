import { renderSlideToCanvas } from "./canvas-render";
import { slidesForExport } from "./export";
import type { BrandConfig } from "./brands";
import type { ProjectState } from "./types";

export type SmartLayoutReviewPreview = {
  slideIndex: number;
  thumbnailBase64: string;
  placement: string;
};

function placementDescription(
  slide: ProjectState["slides"][number],
  photoIndexById: Map<string, number>,
): string {
  const layout = slide.layeredPrints;
  if (!layout) {
    const index = photoIndexById.get(slide.cells[0]?.photoId ?? "");
    return index == null ? "empty" : `foreground/original photo ${index}`;
  }
  const parts: string[] = [`role ${layout.role}`];
  if (layout.background.kind === "photo" && layout.background.photoId) {
    parts.push(`background=original photo ${photoIndexById.get(layout.background.photoId)}`);
  }
  layout.prints.forEach((print, index) => {
    if (print.photoId) parts.push(`foreground ${index + 1}=original photo ${photoIndexById.get(print.photoId)}`);
  });
  const spreadPrints = layout.spreadPrints ?? (layout.spreadPrint ? [layout.spreadPrint] : []);
  spreadPrints.forEach((print, index) => {
    if (print.photoId) parts.push(`spread foreground ${index + 1}=original photo ${photoIndexById.get(print.photoId)}`);
  });
  return parts.join(", ");
}

export async function renderSmartLayoutReviewPreviews(
  state: ProjectState,
  originalPhotoIds: string[],
  brand?: BrandConfig | null,
): Promise<SmartLayoutReviewPreview[]> {
  if (!state.templateId) return [];
  const slides = slidesForExport(state.slides, state.templateId);
  const photosById = new Map(state.photos.map((photo) => [photo.id, photo]));
  const photoIndexById = new Map(originalPhotoIds.map((id, index) => [id, index]));

  return Promise.all(slides.map(async (slide, slideIndex) => {
    const canvas = await renderSlideToCanvas(slide, photosById, {
      filter: state.filter,
      borderWidth: state.borderWidth,
      templateId: state.templateId!,
      aspectRatio: state.aspectRatio,
      slideIndex,
      width: 256,
      height: state.aspectRatio === "1:1" ? 256 : 320,
      brand,
    });
    return {
      slideIndex,
      thumbnailBase64: canvas.toDataURL("image/jpeg", 0.72).split(",")[1] ?? "",
      placement: placementDescription(slide, photoIndexById),
    };
  }));
}
