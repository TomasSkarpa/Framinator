"use client";

import { useEffect, useState } from "react";
import { renderSlidePreviewDataUrl } from "@/lib/canvas-render";
import { useProject } from "@/lib/project-context";
import { isLayeredTemplate } from "@/lib/templates";
import type { Slide } from "@/lib/types";

export function useSlidePreviewUrl(slide: Slide | null): string | null {
  const { state } = useProject();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const templateId = state.templateId;
    if (!templateId || !slide) return;

    const layered = isLayeredTemplate(templateId) && slide.layeredPrints;
    if (!layered && !slide.cells[0]?.photoId) return;

    const slideIndex = state.slides.findIndex((s) => s.id === slide.id);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const photosById = new Map(state.photos.map((p) => [p.id, p]));
      void renderSlidePreviewDataUrl(slide, photosById, {
        filter: state.filter,
        borderWidth: state.borderWidth,
        templateId,
        aspectRatio: state.aspectRatio,
        slideIndex: slideIndex >= 0 ? slideIndex : 0,
      }).then((u) => {
        if (!cancelled) setUrl(u);
      });
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slide, state.photos, state.slides, state.templateId, state.filter, state.borderWidth, state.aspectRatio]);

  return url;
}
