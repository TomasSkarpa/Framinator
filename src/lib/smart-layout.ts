import { clampCrop as clampCropValues } from "./crop-math";
import { DEFAULT_PHOTO_CROP, type AspectRatio } from "./constants";
import { smartLayoutFrameContext } from "./template-frame";
import { normalizeFilter } from "./filters";
import { reflowLayeredPrintsSlides } from "./layered-prints";
import { isLayeredSpreadTemplate, reflowSpreadSlides } from "./layered-spreads";
import {
  buildSlides,
  isLayeredTemplate,
  normalizeTemplateId,
  slidesFromPhotos,
  syncSimpleSlides,
  TEMPLATES,
} from "./templates";
import type { FilterPreset, PhotoCrop, PhotoItem, ProjectState, TemplateId } from "./types";

export type SmartLayoutCrop = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

/** Plan mapped to Framinator photo and slide ids. */
export type SmartLayoutPlan = {
  photoOrder: string[];
  slideOrder?: string[];
  crops?: Record<string, SmartLayoutCrop>;
  templateId?: TemplateId;
  filter?: FilterPreset;
  summary?: string;
};

export type SmartLayoutNotice = {
  postDescription: string;
  whyArranged: string;
};

/** 10–20s; scales with text length. */
export function noticeDurationMs(notice: SmartLayoutNotice): number {
  const chars = notice.postDescription.length + notice.whyArranged.length;
  return Math.min(20_000, Math.max(10_000, 10_000 + chars * 40));
}

export function noticeFromPayload(payload: SmartLayoutApiPayload): SmartLayoutNotice {
  const postDescription =
    payload.postDescription?.trim() ||
    payload.summary?.trim() ||
    "A carousel from your selected photos.";
  const whyArranged =
    payload.whyArranged?.trim() ||
    payload.details?.[0]?.trim() ||
    "Photos reordered for a clearer story from first slide to last.";
  return { postDescription, whyArranged };
}

export type SmartLayoutCropEntry = SmartLayoutCrop & { photoIndex: number };

/** Raw Gemini response uses photo/slide indices. */
export type SmartLayoutApiPayload = {
  photoOrder: number[];
  slideOrder?: number[];
  crops?: SmartLayoutCropEntry[];
  templateId?: string;
  filter?: string;
  postDescription?: string;
  whyArranged?: string;
  /** @deprecated legacy Gemini fields */
  summary?: string;
  details?: string[];
};

export type SmartLayoutRequestPhoto = {
  id: string;
  name: string;
  thumbnailBase64: string;
};

export function clampCrop(crop: SmartLayoutCrop): PhotoCrop {
  return clampCropValues(crop);
}

export function reorderByIds<T extends { id: string }>(items: T[], order: string[]): T[] {
  const map = new Map(items.map((item) => [item.id, item]));
  const out: T[] = [];
  for (const id of order) {
    const item = map.get(id);
    if (item) {
      out.push(item);
      map.delete(id);
    }
  }
  for (const item of items) {
    if (map.has(item.id)) out.push(item);
  }
  return out;
}

export function apiPayloadToPlan(
  payload: SmartLayoutApiPayload,
  photos: PhotoItem[],
  slides: { id: string }[],
): SmartLayoutPlan | null {
  if (!Array.isArray(payload.photoOrder) || payload.photoOrder.length === 0) return null;

  const photoOrder = payload.photoOrder
    .map((i) => photos[i]?.id)
    .filter((id): id is string => !!id);
  if (photoOrder.length === 0) return null;

  const slideOrder = payload.slideOrder
    ?.map((i) => slides[i]?.id)
    .filter((id): id is string => !!id);

  const crops: Record<string, SmartLayoutCrop> = {};
  if (Array.isArray(payload.crops)) {
    for (const entry of payload.crops) {
      const photo = photos[entry.photoIndex];
      if (photo) crops[photo.id] = clampCrop(entry);
    }
  }

  const templateId = payload.templateId
    ? normalizeTemplateId(payload.templateId) ?? undefined
    : undefined;

  return {
    photoOrder,
    slideOrder: slideOrder && slideOrder.length > 0 ? slideOrder : undefined,
    crops: Object.keys(crops).length > 0 ? crops : undefined,
    templateId,
    filter: payload.filter ? normalizeFilter(payload.filter) : undefined,
    summary: payload.summary,
  };
}

export function applySmartLayoutPlan(state: ProjectState, plan: SmartLayoutPlan): ProjectState {
  const photoMap = new Map(state.photos.map((p) => [p.id, p]));
  const orderedIds = plan.photoOrder.filter((id) => photoMap.has(id));
  for (const p of state.photos) {
    if (!orderedIds.includes(p.id)) orderedIds.push(p.id);
  }

  const photos = orderedIds.map((id) => {
    const photo = photoMap.get(id)!;
    const crop = plan.crops?.[id];
    return crop ? { ...photo, crop } : photo;
  });

  const nextTemplateId = plan.templateId ?? state.templateId;
  const templateChanged =
    plan.templateId != null && plan.templateId !== state.templateId;

  let slides = state.slides;
  if (nextTemplateId) {
    if (templateChanged) {
      slides = slidesFromPhotos(nextTemplateId, photos, []);
    } else if (isLayeredTemplate(nextTemplateId)) {
      slides = slidesFromPhotos(nextTemplateId, photos, state.slides);
    } else {
      slides = syncSimpleSlides(state.slides, photos);
    }
  }

  if (plan.slideOrder && plan.slideOrder.length > 0) {
    slides = reorderByIds(slides, plan.slideOrder);
  }

  return {
    ...state,
    photos,
    slides,
    templateId: nextTemplateId,
    filter: plan.filter ?? state.filter,
  };
}

export async function photoToThumbnailBase64(objectUrl: string, maxEdge = 512): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Thumbnail decode failed"));
    el.src = objectUrl;
  });

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = maxEdge / Math.max(iw, ih, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(iw * scale));
  canvas.height = Math.max(1, Math.round(ih * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Thumbnail encode failed");
  return base64;
}

export async function buildSmartLayoutRequestPhotos(
  photos: PhotoItem[],
): Promise<SmartLayoutRequestPhoto[]> {
  return Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      name: photo.name,
      thumbnailBase64: await photoToThumbnailBase64(photo.objectUrl),
    })),
  );
}

export function buildSmartLayoutPrompt(
  photos: { index: number; name: string }[],
  templateId: TemplateId | null,
  slideRoles: string[],
  aspectRatio: AspectRatio = "4:5",
): string {
  const templateLine = templateId
    ? `Current template: ${templateId}. Keep this template unless none was selected.`
    : "No template selected yet; pick the best fit from the list.";

  const templateList = TEMPLATES.map((t) => `${t.id} (${t.description})`).join(", ");
  const frameContext = smartLayoutFrameContext(templateId, aspectRatio);

  return `You are arranging photos for an Instagram carousel app.

${templateLine}
Available templates: ${templateList}

Frame for cropping:
${frameContext}

Photos (index → filename; thumbnails follow in the same order):
${photos.map((p) => `${p.index}: ${p.name}`).join("\n")}

Slide structure (index → role):
${slideRoles.length > 0 ? slideRoles.map((r, i) => `${i}: ${r}`).join("\n") : "One photo per slide in tray order."}

Return JSON only:
- photoOrder: number[] — photo indices for tray fill order (leftmost fills first frame)
- slideOrder: number[] — optional carousel slide order for story flow
- crops: array of { photoIndex, offsetX (-200..200), offsetY (-200..200), scale (0.25..2) } — REQUIRED for every photo where the main subject would be clipped or off-center at default crop (offset 0,0 scale 1). On layered templates one crop per photoIndex (user refines per frame later).
- templateId: string — only if no template or a clearly better fit exists
- filter: string — optional film filter id (portra-400, velvia, classic-chrome, none, etc.)
- postDescription: string — one sentence: what this carousel post will feel like to a viewer (story/mood, no photo numbers or template names)
- whyArranged: string — one sentence: why you ordered and placed photos this way (plain language, no indices or jargon)

Subject framing (critical):
- In each thumbnail, find the main subject: person, face, product, signage, or focal object.
- Center that subject in the frame described above. Do not crop from the geometric image center when the subject sits to one side.
- offsetX: positive reveals more of the RIGHT side of the source photo; negative reveals more of the LEFT.
- offsetY: positive reveals lower in the source; negative reveals higher.
- scale > 1 zooms in when the subject is small; keep faces fully inside the frame.
- Never leave a person or face cut off at an edge when pan/zoom within the ranges above can fix it.

Story order: strong hook on slide 1, chronological flow when dates implied, pair similar shots on diptych slides, wide landscapes as backgrounds on hero slides. Horizons level where relevant.`;
}

// ponytail: dev-only guard; fails if reorder/apply breaks id mapping
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const stub = (id: string): PhotoItem => ({
    id,
    name: id,
    objectUrl: "",
    crop: { ...DEFAULT_PHOTO_CROP },
  });
  const state: ProjectState = {
    photos: [stub("a"), stub("b"), stub("c")],
    templateId: "clean-carousel",
    slides: [
      { id: "s1", cells: [{ photoId: "a" }] },
      { id: "s2", cells: [{ photoId: "b" }] },
      { id: "s3", cells: [{ photoId: "c" }] },
    ],
    filter: "none",
    borderWidth: 8,
    aspectRatio: "4:5",
  };
  const next = applySmartLayoutPlan(state, {
    photoOrder: ["c", "a", "b"],
    slideOrder: ["s3", "s1", "s2"],
    crops: { c: { offsetX: 10, offsetY: -5, scale: 1.2 } },
  });
  if (next.photos.map((p) => p.id).join() !== "c,a,b") {
    throw new Error("smart-layout self-check: photo reorder broken");
  }
  if (next.slides.map((s) => s.id).join() !== "s3,s1,s2") {
    throw new Error("smart-layout self-check: slide reorder broken");
  }
  if (next.photos[0].crop.scale !== 1.2) {
    throw new Error("smart-layout self-check: crop apply broken");
  }
  const kodakPrompt = buildSmartLayoutPrompt([{ index: 0, name: "portrait.jpg" }], "kodak-strip", [], "4:5");
  if (!kodakPrompt.includes("Subject framing") || !kodakPrompt.includes("0.7111")) {
    throw new Error("smart-layout self-check: subject framing prompt broken");
  }
  void reflowLayeredPrintsSlides;
  void reflowSpreadSlides;
  void buildSlides;
  void isLayeredSpreadTemplate;
}
