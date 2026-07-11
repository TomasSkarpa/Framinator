"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Columns2,
  Film,
  Focus,
  Grip,
  Hash,
  Image,
  Layers,
  GalleryHorizontal,
  MoveDownRight,
  RotateCw,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { renderSlidePreviewDataUrl } from "@/lib/canvas-render";
import { isLayeredSpreadTemplate } from "@/lib/layered-spreads";
import { useProject } from "@/lib/project-context";
import { buildSlides } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { cn, pressable } from "@/lib/utils";

const ICONS: Record<string, ReactNode> = {
  frame: <Hash className="h-5 w-5" />,
  carousel: <Image className="h-5 w-5" />,
  film: <Film className="h-5 w-5" />,
  layers: <Layers className="h-5 w-5" />,
  panorama: <GalleryHorizontal className="h-5 w-5" />,
  scatter: <Grip className="h-5 w-5" />,
  cascade: <MoveDownRight className="h-5 w-5" />,
  corner: <SquareArrowOutUpRight className="h-5 w-5" />,
  tilted: <RotateCw className="h-5 w-5" />,
  split: <Columns2 className="h-5 w-5" />,
  focus: <Focus className="h-5 w-5" />,
};

function TemplatePreview({
  templateId,
}: {
  templateId: TemplateId;
}) {
  const { state, brand } = useProject();
  const [urls, setUrls] = useState<string[]>([]);
  const isSpread = isLayeredSpreadTemplate(templateId);

  useEffect(() => {
    if (state.photos.length === 0) return;
    const slides = buildSlides(templateId, state.photos);
    const previewSlides = slides.slice(0, isSpread ? 2 : 1);
    if (previewSlides.length === 0) return;
    const map = new Map(state.photos.map((p) => [p.id, p]));
    let cancelled = false;
    void Promise.all(
      previewSlides.map((slide, slideIndex) =>
        renderSlidePreviewDataUrl(slide, map, {
          filter: state.filter,
          borderWidth: state.borderWidth,
          templateId,
          aspectRatio: state.aspectRatio,
          slideIndex,
          brand,
        }),
      ),
    ).then((nextUrls) => {
      if (!cancelled) setUrls(nextUrls);
    });
    return () => {
      cancelled = true;
    };
  }, [brand, isSpread, templateId, state.photos, state.filter, state.borderWidth, state.aspectRatio]);

  if (urls.length === 0) {
    return <div className="aspect-[4/5] w-full animate-pulse rounded-md bg-zinc-800" />;
  }

  if (isSpread) {
    return (
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-zinc-950 p-2"
        data-preview-mode="spread"
        data-testid={`template-preview-${templateId}`}
      >
        <div className="grid h-full grid-cols-2 items-center gap-1.5">
          {urls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`Slide ${index + 1} preview`}
              className="w-full rounded-sm shadow-md"
              style={{ aspectRatio: "4 / 5" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <img
      src={urls[0]}
      alt=""
      className="aspect-[4/5] w-full rounded-md object-cover"
      data-preview-mode="single"
      data-testid={`template-preview-${templateId}`}
    />
  );
}

export function TemplatePicker() {
  const { state, setTemplate, availableTemplates } = useProject();
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(true);
  const chosen = availableTemplates.find((t) => t.id === state.templateId);
  const showPicker = !state.templateId || expanded;

  useEffect(() => {
    setExpanded(!state.templateId);
  }, [state.templateId]);

  useEffect(() => {
    if (!showPicker) return;
    selectedRef.current?.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
  }, [state.templateId, showPicker]);

  if (state.photos.length === 0) return null;

  if (!showPicker && chosen) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Template</h2>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-zinc-400">{ICONS[chosen.icon]}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{chosen.name}</p>
              <p className="truncate text-xs text-zinc-500">{chosen.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              pressable,
              "flex shrink-0 items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600",
            )}
          >
            Change
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-300">Choose a template</h2>
        {state.templateId && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            data-testid="template-picker-done"
            className={cn(
              pressable,
              "cursor-pointer rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 active:bg-zinc-700",
            )}
          >
            Done
          </button>
        )}
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {availableTemplates.map((t) => {
            const selected = state.templateId === t.id;
            return (
              <button
                key={t.id}
                ref={selected ? selectedRef : undefined}
                type="button"
                onClick={() => {
                  setTemplate(t.id);
                  setExpanded(false);
                }}
                className={cn(
                  pressable,
                  "w-[min(72vw,200px)] shrink-0 snap-center rounded-xl text-left",
                  selected && "relative z-10 ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950",
                )}
                data-testid={`template-${t.id}`}
              >
                <Card
                  className="transition-[border-color,box-shadow] duration-150 hover:border-zinc-600 active:border-zinc-500"
                >
                  <CardHeader className="pb-2">
                    <div className="flex min-w-0 items-center gap-2 text-zinc-200">
                      <span className="shrink-0">{ICONS[t.icon]}</span>
                      <CardTitle className="min-w-0 truncate text-sm">{t.name}</CardTitle>
                    </div>
                    <CardDescription className="truncate text-xs">
                      {t.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplatePreview templateId={t.id} />
                  </CardContent>
                </Card>
              </button>
            );
          })}
      </div>
    </section>
  );
}
