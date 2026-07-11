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
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useCallback, useState } from "react";
import { exportHeight, EXPORT_WIDTH } from "@/lib/constants";
import { slideCropTargets } from "@/lib/slide-crop";
import { spreadPrintsForLayout } from "@/lib/layered-spreads";
import { useProject } from "@/lib/project-context";
import { isLayeredTemplate } from "@/lib/templates";
import { useSlidePreviewUrl } from "@/lib/use-slide-preview-url";
import type { Slide } from "@/lib/types";
import { cn, pressable } from "@/lib/utils";

const IG_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function VerifiedBadge() {
  return (
    <svg width="12" height="12" viewBox="0 0 40 40" className="ml-1 shrink-0" aria-hidden>
      <path
        fill="#3897f0"
        d="M19.998 3.094 24.322 0l2.531 5.026 5.539-1.212.9 5.594 5.592.902-1.211 5.54L42.7 13.38l-3.095 4.62L42.7 22.62l-5.026 2.532 1.211 5.539-5.592.902-.9 5.594-5.539-1.212L24.322 40l-4.324-3.095L15.674 40l-2.531-5.026-5.539 1.212-.9-5.594-5.592-.902 1.211-5.54L-.7 22.62l3.095-4.62L-.7 13.38l5.026-2.532-1.211-5.539 5.592-.902.9-5.594 5.539 1.212L19.998 3.094Z"
        transform="translate(0.7 0)"
      />
      <path fill="#fff" d="m17.5 25.5-5-5 1.8-1.8 3.2 3.2 7.2-7.2 1.8 1.8-9 9Z" />
    </svg>
  );
}

function SlideThumb({ slide, index }: { slide: Slide; index: number }) {
  const { state } = useProject();
  const url = useSlidePreviewUrl(slide);
  const aspect = `${EXPORT_WIDTH}/${exportHeight(state.aspectRatio)}`;

  return (
    <div className="relative w-[min(72vw,280px)] shrink-0 rounded-lg">
      {url ? (
        <img
          src={url}
          alt={`Slide ${index + 1}`}
          className="w-full rounded-lg border border-zinc-700 shadow-lg"
          style={{ aspectRatio: aspect }}
        />
      ) : (
        <div className="w-full animate-pulse rounded-lg bg-zinc-800" style={{ aspectRatio: aspect }} />
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {index + 1}
      </span>
    </div>
  );
}

function InstagramFeedPreview({
  slide,
  slideIndex,
  slideCount,
  onPrev,
  onNext,
  onSelectSlide,
}: {
  slide: Slide;
  slideIndex: number;
  slideCount: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectSlide: (index: number) => void;
}) {
  const { state } = useProject();
  const url = useSlidePreviewUrl(slide);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasCarousel = slideCount > 1;
  const aspect = `${EXPORT_WIDTH}/${exportHeight(state.aspectRatio)}`;
  const avatarUrl = state.photos[0]?.objectUrl ?? "https://i.pravatar.cc/100?img=12";

  return (
    <div
      className="mx-auto w-full max-w-[470px] select-none rounded-md border border-gray-200 bg-white"
      style={{ fontFamily: IG_FONT }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-100"
          />
          <div className="flex items-center text-[13px] leading-none">
            <span className="font-semibold text-gray-900">yourbrand</span>
            <VerifiedBadge />
            <span className="mx-1 text-gray-400">•</span>
            <span className="text-gray-500">1d</span>
          </div>
        </div>
        <MoreHorizontal size={18} className="text-gray-800" aria-hidden />
      </div>

      <div
        className="relative w-full overflow-hidden bg-gray-100"
        style={{ aspectRatio: aspect }}
        data-testid="feed-preview-frame"
      >
        {url ? (
          <img
            src={url}
            alt={`Slide ${slideIndex + 1}`}
            className="h-full w-full object-cover"
            data-testid="feed-preview-image"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-gray-200" />
        )}

        {hasCarousel && (
          <>
            {slideIndex > 0 && (
              <button
                type="button"
                onClick={onPrev}
                className={cn(
                  pressable,
                  "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow transition-[transform,background-color] hover:bg-white active:scale-95 active:bg-white",
                )}
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {slideIndex < slideCount - 1 && (
              <button
                type="button"
                onClick={onNext}
                className={cn(
                  pressable,
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow transition-[transform,background-color] hover:bg-white active:scale-95 active:bg-white",
                )}
                aria-label="Next slide"
              >
                <ChevronRight size={16} />
              </button>
            )}
            <div className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
              {slideIndex + 1}/{slideCount}
            </div>
          </>
        )}
      </div>

      {hasCarousel && (
        <div className="flex justify-center gap-[5px] py-2" data-testid="feed-preview-dots">
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSlide(i)}
              className={cn(
                pressable,
                "h-[6px] w-[6px] rounded-full transition-opacity",
                i === slideIndex ? "bg-[#0095f6]" : "bg-[#dbdbdb] hover:opacity-80 active:opacity-60",
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-3.5">
          <Heart
            size={24}
            className={cn(
              "cursor-pointer transition-transform duration-150 active:scale-90 motion-reduce:active:scale-100",
              liked ? "fill-red-500 stroke-red-500" : "text-gray-900",
            )}
            onClick={() => setLiked((v) => !v)}
            aria-label={liked ? "Unlike" : "Like"}
          />
          <MessageCircle
            size={24}
            className="-scale-x-100 cursor-pointer text-gray-900"
            aria-hidden
          />
          <Send size={22} className="cursor-pointer text-gray-900" aria-hidden />
        </div>
        <Bookmark
          size={24}
          className={cn(
            "cursor-pointer text-gray-900 transition-transform duration-150 active:scale-90 motion-reduce:active:scale-100",
            saved && "fill-gray-900",
          )}
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? "Unsave" : "Save"}
        />
      </div>

      <div className="px-3 pb-3 pt-1.5 text-[13px] leading-snug">
        <p className="font-semibold text-gray-900">
          {(1284 + (liked ? 1 : 0)).toLocaleString()} likes
        </p>
        <p className="mt-0.5 text-gray-900">
          <span className="mr-1 font-semibold">yourbrand</span>
          Your caption goes here. This is placeholder copy for the feed preview.
        </p>
        <p className="mt-1 text-gray-400">View all 42 comments</p>
        <p className="mt-1.5 text-[10px] uppercase tracking-wide text-gray-400">1 day ago</p>
      </div>
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
  const { state } = useProject();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: slide.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedNames =
    isLayeredTemplate(state.templateId) &&
    slide.layeredPrints
      ? [
          slide.layeredPrints.background.kind === "photo"
            ? slide.layeredPrints.background.photoId
            : undefined,
          ...spreadPrintsForLayout(slide.layeredPrints).map((p) => p.photoId),
          ...slide.layeredPrints.prints.map((p) => p.photoId),
        ]
          .filter(Boolean)
          .map((id) => state.photos.find((p) => p.id === id)?.name ?? "")
          .filter(Boolean)
          .join("|")
      : undefined;

  const sourcePhotos = Array.from(
    new Set(slideCropTargets(slide).map((target) => target.photoId)),
  )
    .map((photoId) => state.photos.find((photo) => photo.id === photoId))
    .filter((photo) => photo !== undefined);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative shrink-0", isActive && "z-10")}
      {...(assignedNames !== undefined
        ? {
            "data-assigned-names": assignedNames || "empty",
            "data-slide-role": slide.layeredPrints?.role ?? "",
          }
        : {})}
    >
      <button
        type="button"
        data-testid={`slide-thumb-${index + 1}`}
        onClick={onSelect}
        className={cn(
          pressable,
          "block rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          isActive && "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950",
        )}
      >
        <SlideThumb slide={slide} index={index} />
      </button>
      <div className="mt-2 flex min-h-7 items-center gap-1.5 px-0.5">
        <div className="flex -space-x-1">
          {sourcePhotos.map((photo) => (
            <img
              key={photo.id}
              src={photo.objectUrl}
              alt=""
              title={photo.name}
              className="h-6 w-6 rounded-full border-2 border-zinc-950 object-cover"
            />
          ))}
        </div>
        <span
          className={cn(
            "max-w-32 truncate text-[10px] text-zinc-500",
            isActive && "font-medium text-blue-300",
          )}
          title={sourcePhotos.map((photo) => photo.name).join(", ")}
        >
          {isActive
            ? "Editing this slide"
            : sourcePhotos.length === 1
              ? sourcePhotos[0]?.name
              : `${sourcePhotos.length} photos`}
        </span>
      </div>
      <button
        type="button"
        className={cn(
          pressable,
          "absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white active:bg-zinc-700",
        )}
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

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        {selectedSlide && (
          <InstagramFeedPreview
            slide={selectedSlide}
            slideIndex={selectedSlideIndex}
            slideCount={state.slides.length}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
            onSelectSlide={(i) => {
              const s = state.slides[i];
              if (s) selectSlide(s.id);
            }}
          />
        )}
        <p className="mt-3 text-center text-xs text-zinc-500">
          Slide {selectedSlideIndex + 1} of {state.slides.length} · rendered at Instagram feed
          size ({state.aspectRatio})
        </p>
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Reorder slides
        </h3>
        <p className="mb-3 text-xs text-zinc-500">
          {isLayeredTemplate(state.templateId)
            ? "Drag slides to change carousel order. Adjust crop in Customize below."
            : "Select a slide, then adjust crop in Customize below."}
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={state.slides.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-3 overflow-x-auto p-2.5">
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
