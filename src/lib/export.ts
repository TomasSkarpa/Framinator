import JSZip from "jszip";
import { renderSlideToCanvas } from "./canvas-render";
import { EXPORT_WIDTH, exportHeight } from "./constants";
import type { PhotoItem, ProjectState, Slide } from "./types";

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      type,
      0.92,
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportSlides(
  slides: Slide[],
  photos: PhotoItem[],
  project: Pick<
    ProjectState,
    "filter" | "borderWidth" | "templateId" | "aspectRatio"
  >,
  format: "jpeg" | "png" = "jpeg",
): Promise<void> {
  if (!project.templateId) return;

  const photosById = new Map(photos.map((p) => [p.id, p]));
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = format === "jpeg" ? "jpg" : "png";
  const zip = new JSZip();

  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderSlideToCanvas(slides[i], photosById, {
      filter: project.filter,
      borderWidth: project.borderWidth,
      templateId: project.templateId,
      aspectRatio: project.aspectRatio,
      width: EXPORT_WIDTH,
      height: exportHeight(project.aspectRatio),
    });
    const blob = await canvasToBlob(canvas, mime);
    const name = `${String(i + 1).padStart(2, "0")}.${ext}`;
    zip.file(name, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, "framinator-carousel.zip");
}

export async function exportSingleSlide(
  slide: Slide,
  index: number,
  photos: PhotoItem[],
  project: Pick<
    ProjectState,
    "filter" | "borderWidth" | "templateId" | "aspectRatio"
  >,
  format: "jpeg" | "png" = "jpeg",
): Promise<void> {
  if (!project.templateId) return;

  const photosById = new Map(photos.map((p) => [p.id, p]));
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = format === "jpeg" ? "jpg" : "png";
  const canvas = await renderSlideToCanvas(slide, photosById, {
    filter: project.filter,
    borderWidth: project.borderWidth,
    templateId: project.templateId,
    aspectRatio: project.aspectRatio,
    width: EXPORT_WIDTH,
    height: exportHeight(project.aspectRatio),
  });
  const blob = await canvasToBlob(canvas, mime);
  downloadBlob(blob, `${String(index + 1).padStart(2, "0")}.${ext}`);
}
