/** Max edge for working copies; 1080 export × 2× crop zoom. */
const MAX_EDGE = 2160;
const JPEG_QUALITY = 0.88;

function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image decode failed"));
    };
    img.src = url;
  });
}

/**
 * Downscale large uploads so previews and canvas compositing stay responsive.
 * Uses Image() (same as canvas-render) so EXIF orientation matches every slide.
 */
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let img: HTMLImageElement;
  try {
    img = await loadFileAsImage(file);
  } catch {
    return file;
  }

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.min(1, MAX_EDGE / Math.max(iw, ih));
  if (scale >= 1) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(iw * scale);
  canvas.height = Math.round(ih * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
