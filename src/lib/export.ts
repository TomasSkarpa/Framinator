import JSZip from "jszip";
import { renderSlideToCanvas } from "./canvas-render";
import { EXPORT_WIDTH, exportHeight } from "./constants";
import { layeredPrintsSlideHasContent } from "./layered-prints";
import { isLayeredSpreadTemplate, spreadSlideHasContent } from "./layered-spreads";
import type { PhotoItem, ProjectState, Slide, TemplateId } from "./types";

export function slidesForExport(slides: Slide[], templateId: TemplateId | null): Slide[] {
  if (templateId === "layered-prints") return slides.filter(layeredPrintsSlideHasContent);
  if (isLayeredSpreadTemplate(templateId)) return slides.filter(spreadSlideHasContent);
  return slides;
}

export type ExportFormat = "jpeg" | "png";

export type ExportProject = Pick<
  ProjectState,
  "filter" | "borderWidth" | "templateId" | "aspectRatio"
>;

export type RenderedSlide = {
  index: number;
  filename: string;
  blob: Blob;
  previewUrl: string;
};

function mimeForFormat(format: ExportFormat): string {
  return format === "jpeg" ? "image/jpeg" : "image/png";
}

function extForFormat(format: ExportFormat): string {
  return format === "jpeg" ? "jpg" : "png";
}

function slideFilename(index: number, format: ExportFormat): string {
  return `${String(index + 1).padStart(2, "0")}.${extForFormat(format)}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      type,
      0.92,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareFiles(files: File[], title?: string): Promise<void> {
  await navigator.share({ files, title });
}

export function revokeRenderedSlides(slides: RenderedSlide[]): void {
  for (const slide of slides) {
    URL.revokeObjectURL(slide.previewUrl);
  }
}

async function renderSlideBlob(
  slide: Slide,
  index: number,
  photosById: Map<string, PhotoItem>,
  project: ExportProject,
  format: ExportFormat,
): Promise<Blob> {
  if (!project.templateId) throw new Error("No template selected");
  const canvas = await renderSlideToCanvas(slide, photosById, {
    filter: project.filter,
    borderWidth: project.borderWidth,
    templateId: project.templateId,
    aspectRatio: project.aspectRatio,
    slideIndex: index,
    width: EXPORT_WIDTH,
    height: exportHeight(project.aspectRatio),
  });
  return canvasToBlob(canvas, mimeForFormat(format));
}

export async function renderAllSlides(
  slides: Slide[],
  photos: PhotoItem[],
  project: ExportProject,
  format: ExportFormat = "jpeg",
): Promise<RenderedSlide[]> {
  if (!project.templateId) return [];

  const exportSlides = slidesForExport(slides, project.templateId);
  const photosById = new Map(photos.map((p) => [p.id, p]));
  const rendered: RenderedSlide[] = [];

  for (let i = 0; i < exportSlides.length; i++) {
    const blob = await renderSlideBlob(exportSlides[i], i, photosById, project, format);
    rendered.push({
      index: i,
      filename: slideFilename(i, format),
      blob,
      previewUrl: URL.createObjectURL(blob),
    });
  }

  return rendered;
}

export async function downloadRenderedSlidesZip(slides: RenderedSlide[]): Promise<void> {
  const zip = new JSZip();
  for (const slide of slides) {
    zip.file(slide.filename, slide.blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, "framinator-carousel.zip");
}

export async function exportSlidesZip(
  slides: Slide[],
  photos: PhotoItem[],
  project: ExportProject,
  format: ExportFormat = "jpeg",
): Promise<void> {
  const rendered = await renderAllSlides(slides, photos, project, format);
  try {
    await downloadRenderedSlidesZip(rendered);
  } finally {
    revokeRenderedSlides(rendered);
  }
}

/** @deprecated Use exportSlidesZip */
export const exportSlides = exportSlidesZip;

export async function exportSingleSlide(
  slide: Slide,
  index: number,
  photos: PhotoItem[],
  project: ExportProject,
  format: ExportFormat = "jpeg",
): Promise<void> {
  if (!project.templateId) return;

  const photosById = new Map(photos.map((p) => [p.id, p]));
  const blob = await renderSlideBlob(slide, index, photosById, project, format);
  downloadBlob(blob, slideFilename(index, format));
}
