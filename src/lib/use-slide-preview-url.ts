"use client";

import { useEffect, useState } from "react";
import { renderSlidePreviewDataUrl } from "@/lib/canvas-render";
import { useProject } from "@/lib/project-context";
import type { Slide } from "@/lib/types";

export function useSlidePreviewUrl(slide: Slide | null): string | null {
  const { state } = useProject();
  const [url, setUrl] = useState<string | null>(null);
  const photoId = slide?.cells[0]?.photoId;
  const photo = photoId ? state.photos.find((p) => p.id === photoId) : undefined;

  useEffect(() => {
    const templateId = state.templateId;
    if (!templateId || !slide || !photo) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const photosById = new Map([[photo.id, photo]]);
      void renderSlidePreviewDataUrl(slide, photosById, {
        filter: state.filter,
        borderWidth: state.borderWidth,
        templateId,
        aspectRatio: state.aspectRatio,
      }).then((u) => {
        if (!cancelled) setUrl(u);
      });
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slide, photo, state.templateId, state.filter, state.borderWidth, state.aspectRatio]);

  return url;
}
