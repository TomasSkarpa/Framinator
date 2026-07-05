"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { renderSlidePreviewDataUrl } from "@/lib/canvas-render";
import { exportHeight, EXPORT_WIDTH } from "@/lib/constants";
import { useProject } from "@/lib/project-context";
import type { Slide } from "@/lib/types";
import { cn } from "@/lib/utils";

function SlideThumb({ slide, index }: { slide: Slide; index: number }) {
  const { state } = useProject();
  const [url, setUrl] = useState<string | null>(null);
  const photosById = useMemo(
    () => new Map(state.photos.map((p) => [p.id, p])),
    [state.photos],
  );

  useEffect(() => {
    if (!state.templateId) return;
    let cancelled = false;
    void renderSlidePreviewDataUrl(slide, photosById, {
      filter: state.filter,
      borderWidth: state.borderWidth,
      templateId: state.templateId,
      aspectRatio: state.aspectRatio,
    }).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [slide, photosById, state]);

  return (
    <div className="relative shrink-0 w-[min(72vw,280px)]">
      {url ? (
        <img
          src={url}
          alt={`Slide ${index + 1}`}
          className="w-full rounded-lg border border-zinc-700 shadow-lg"
          style={{ aspectRatio: `${EXPORT_WIDTH}/${exportHeight(state.aspectRatio)}` }}
        />
      ) : (
        <div
          className="w-full animate-pulse rounded-lg bg-zinc-800"
          style={{ aspectRatio: `${EXPORT_WIDTH}/${exportHeight(state.aspectRatio)}` }}
        />
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {index + 1}
      </span>
    </div>
  );
}

function SortableSlide({
  slide,
  index,
  isActive,
  onSelect,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: slide.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative shrink-0">
      <button type="button" onClick={onSelect} className="block">
        <div className={cn(isActive && "ring-2 ring-blue-500 rounded-lg")}>
          <SlideThumb slide={slide} index={index} />
        </div>
      </button>
      <button
        type="button"
        className="absolute right-1 top-1 rounded bg-zinc-900/80 p-1 text-zinc-400 hover:text-white"
        {...attributes}
        {...listeners}
        aria-label={`Drag slide ${index + 1}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CarouselPreview() {
  const {
    state,
    reorderSlides,
    selectedSlideId,
    selectedSlideIndex,
    selectedSlide,
    selectSlide,
  } = useProject();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = state.slides.findIndex((s) => s.id === active.id);
      const newIndex = state.slides.findIndex((s) => s.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        reorderSlides(oldIndex, newIndex);
      }
    },
    [state.slides, reorderSlides],
  );

  if (!state.templateId || state.slides.length === 0) return null;

  const go = (delta: number) => {
    const next = Math.max(
      0,
      Math.min(state.slides.length - 1, selectedSlideIndex + delta),
    );
    const slide = state.slides[next];
    if (slide) selectSlide(slide.id);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-300">Live preview</h2>

      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => go(-1)}
            disabled={selectedSlideIndex === 0}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {selectedSlide && (
            <SlideThumb slide={selectedSlide} index={selectedSlideIndex} />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => go(1)}
            disabled={selectedSlideIndex >= state.slides.length - 1}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-3 flex justify-center gap-1.5">
          {state.slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSlide(s.id)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === selectedSlideIndex ? "bg-blue-500" : "bg-zinc-600",
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <p className="mt-2 text-center text-xs text-zinc-500">
          Slide {selectedSlideIndex + 1} of {state.slides.length} · rendered at
          Instagram&apos;s exact carousel size
        </p>
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Reorder slides
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          Tap a slide to select it for cropping below
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={state.slides.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              {state.slides.map((s, i) => (
                <SortableSlide
                  key={s.id}
                  slide={s}
                  index={i}
                  isActive={selectedSlideId === s.id}
                  onSelect={() => selectSlide(s.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
