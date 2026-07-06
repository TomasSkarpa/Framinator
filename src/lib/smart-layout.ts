import { CROP_SCALE_MAX, CROP_SCALE_MIN, DEFAULT_PHOTO_CROP } from "./constants";
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
  headline: string;
  details: string[];
};

/** 10–20s; scales with text length (~250 chars/s reading pace). */
export function noticeDurationMs(notice: SmartLayoutNotice): number {
  const chars = notice.headline.length + notice.details.join("").length;
  return Math.min(20_000, Math.max(10_000, 10_000 + chars * 40));
}

export function noticeFromPayload(payload: SmartLayoutApiPayload): SmartLayoutNotice {
  const details = (payload.details ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return {
    headline: payload.summary?.trim() || "Smart layout applied",
    details: details.length > 0 ? details : ["Photos reordered for a clearer carousel flow."],
  };
}

export type SmartLayoutCropEntry = SmartLayoutCrop & { photoIndex: number };

/** Raw Gemini response uses photo/slide indices. */
export type SmartLayoutApiPayload = {
  photoOrder: number[];
  slideOrder?: number[];
  crops?: SmartLayoutCropEntry[];
  templateId?: string;
  filter?: string;
  summary?: string;
  details?: string[];
};

export type SmartLayoutRequestPhoto = {
  id: string;
  name: string;
  thumbnailBase64: string;
};

export function clampCrop(crop: SmartLayoutCrop): PhotoCrop {
  return {
    offsetX: Math.round(Math.max(-200, Math.min(200, crop.offsetX))),
    offsetY: Math.round(Math.max(-200, Math.min(200, crop.offsetY))),
    scale: Math.max(CROP_SCALE_MIN, Math.min(CROP_SCALE_MAX, crop.scale)),
  };
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

export async function photoToThumbnailBase64(objectUrl: string, maxEdge = 256): Promise<string> {
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
): string {
  const templateLine = templateId
    ? `Current template: ${templateId}.`
    : "No template selected yet; pick the best fit from the list.";

  const templateList = TEMPLATES.map((t) => `${t.id} (${t.description})`).join(", ");

  return `You are arranging photos for an Instagram carousel app.

${templateLine}
Available templates: ${templateList}

Photos (index → filename):
${photos.map((p) => `${p.index}: ${p.name}`).join("\n")}

Slide structure (index → role):
${slideRoles.length > 0 ? slideRoles.map((r, i) => `${i}: ${r}`).join("\n") : "One photo per slide in tray order."}

Return JSON only:
- photoOrder: number[] — photo indices for tray fill order (leftmost fills first frame)
- slideOrder: number[] — optional carousel slide order for story flow
- crops: array of { photoIndex, offsetX (-200..200), offsetY (-200..200), scale (0.25..2) } for photos that need crop tweaks
- templateId: string — only if no template or a better fit exists
- filter: string — optional film filter id (portra-400, velvia, classic-chrome, none, etc.)
- summary: string — short headline (max 12 words)
- details: string[] — 3 to 5 plain-language bullets explaining what you changed and why. Cover template choice (if any), photo tray order, slide story arc, and crops/filter when relevant. Each bullet is one complete sentence, no jargon.

Prioritize: strong hook on slide 1, chronological flow when dates implied, pair similar shots on diptych slides, wide landscapes as backgrounds on hero slides.`;
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
  void reflowLayeredPrintsSlides;
  void reflowSpreadSlides;
  void buildSlides;
  void isLayeredSpreadTemplate;
}
