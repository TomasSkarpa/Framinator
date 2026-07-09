/** Max edge for working copies; 1080 export × 2× crop zoom. */
const MAX_EDGE = 2160;
const JPEG_QUALITY = 0.88;
const HEIC_EXT = /\.(heic|heif)$/i;

function looksLikeHeic(file: File): boolean {
  if (HEIC_EXT.test(file.name)) return true;
  const t = file.type.toLowerCase();
  return t === "image/heic" || t === "image/heif";
}

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

async function heicToJpeg(file: File): Promise<File | null> {
  const { heicTo, isHeic } = await import("heic-to");
  if (!(looksLikeHeic(file) || (await isHeic(file)))) return null;

  try {
    const converted = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: JPEG_QUALITY,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) return null;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

function downscaleIfNeeded(file: File, img: HTMLImageElement): Promise<File> {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.min(1, MAX_EDGE / Math.max(iw, ih));
  if (scale >= 1) return Promise.resolve(file);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(iw * scale);
  canvas.height = Math.round(ih * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(file);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const base = file.name.replace(/\.[^.]+$/, "") || "photo";
        resolve(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Normalize uploads for browser preview and canvas compositing.
 * HEIC/HEIF is converted to JPEG; large images are downscaled.
 */
export async function preparePhoto(file: File): Promise<File | null> {
  if (!file.type.startsWith("image/") && !looksLikeHeic(file)) return null;

  let working = file;
  let img: HTMLImageElement;
  try {
    img = await loadFileAsImage(working);
  } catch {
    const converted = await heicToJpeg(file);
    if (!converted) return null;
    working = converted;
    try {
      img = await loadFileAsImage(working);
    } catch {
      return null;
    }
  }

  return downscaleIfNeeded(working, img);
}

/** ponytail: guard filename/extension sniffing used before heic-to loads. */
export function _looksLikeHeicSelfCheck(): void {
  const cases: [string, boolean][] = [
    ["IMG_1234.HEIC", true],
    ["photo.heif", true],
    ["photo.jpg", false],
    ["photo", false],
  ];
  for (const [name, want] of cases) {
    const got = looksLikeHeic({ name, type: "" } as File);
    if (got !== want) throw new Error(`looksLikeHeic(${name}) = ${got}, want ${want}`);
  }
}
