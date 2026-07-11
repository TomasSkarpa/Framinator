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
import { useCallback, useState, type MouseEvent } from "react";
import { useDropzone } from "react-dropzone";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartLayoutButton } from "@/components/smart-layout-button";
import { MAX_PHOTOS } from "@/lib/constants";
import { useProject } from "@/lib/project-context";
import { useToast } from "@/components/ui/toast";
import type { PhotoItem } from "@/lib/types";
import { cn, pressable } from "@/lib/utils";

function SortablePhoto({
  photo,
  index,
  isEditing,
  onRemove,
}: {
  photo: PhotoItem;
  index: number;
  isEditing: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group relative w-20 shrink-0 hover:z-10", isDragging && "z-20 opacity-80")}
      data-testid={`photo-tray-item-${index}`}
      data-photo-name={photo.name}
      data-editing={isEditing}
    >
      <div
        className={cn(
          "relative rounded-lg border border-zinc-700",
          isEditing && "border-blue-400 ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950",
        )}
      >
        <img
          src={photo.objectUrl}
          alt={photo.name}
          decoding="async"
          loading="lazy"
          className="h-[78px] w-[78px] rounded-[7px] object-cover"
        />
        {isEditing && (
          <span className="absolute inset-x-1 bottom-1 rounded bg-blue-600/95 px-1 py-0.5 text-center text-[9px] font-semibold text-white shadow">
            Editing
          </span>
        )}
      </div>
      <button
        type="button"
        className={cn(
          pressable,
          "absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700",
        )}
        {...attributes}
        {...listeners}
        aria-label={`Drag photo ${index + 1}, ${photo.name}`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          pressable,
          "absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700",
        )}
        aria-label={`Remove ${photo.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p
        className={cn(
          "mt-1 truncate text-[10px] text-zinc-500",
          isEditing && "font-medium text-blue-300",
        )}
        title={photo.name}
      >
        {photo.name}
      </p>
    </div>
  );
}

export function PhotoTray() {
  const { state, addPhotos, removePhoto, reorderPhotos, activeCropPhoto } = useProject();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      setImporting(true);
      void addPhotos(accepted)
        .then(({ rejected, failed, limitHit }) => {
          if (rejected > 0) {
            toast(`${rejected} duplicate file${rejected > 1 ? "s" : ""} skipped`);
          }
          if (failed > 0) {
            toast(`${failed} photo${failed > 1 ? "s" : ""} couldn't be opened`);
          }
          if (limitHit) {
            toast(`Maximum ${MAX_PHOTOS} photos per project`);
          }
        })
        .finally(() => setImporting(false));
    },
    [addPhotos, toast],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
    disabled: importing,
  });

  const pickPhotos = useCallback(
    (e: MouseEvent) => {
      if (importing) return;
      e.stopPropagation();
      open();
    },
    [importing, open],
  );

  const onPhotoDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = state.photos.findIndex((p) => p.id === active.id);
      const newIndex = state.photos.findIndex((p) => p.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        reorderPhotos(oldIndex, newIndex);
      }
    },
    [state.photos, reorderPhotos],
  );

  const sortable = state.photos.length > 1;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-zinc-300">
          Your photos · {state.photos.length} selected
        </h2>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {state.photos.length >= 2 && <SmartLayoutButton />}
          {state.photos.length < MAX_PHOTOS && (
            <Button variant="secondary" size="sm" onClick={pickPhotos} disabled={importing}>
              {importing ? "Processing…" : "Add photos"}
            </Button>
          )}
        </div>
      </div>

      {sortable && (
        <p className="text-xs text-zinc-500">
          Photos fill the design from left to right. Drag to change the order.
        </p>
      )}

      <div
        {...getRootProps()}
        aria-busy={importing}
        className={cn(
          "flex gap-2 overflow-x-auto pb-2",
          isDragActive && !importing && "rounded-xl p-2 ring-2 ring-blue-500",
          importing && "opacity-90",
        )}
      >
        <input {...getInputProps()} />
        {state.photos.length > 0 && sortable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onPhotoDragEnd}>
            <SortableContext
              items={state.photos.map((p) => p.id)}
              strategy={horizontalListSortingStrategy}
            >
              {state.photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  index={index}
                  isEditing={activeCropPhoto?.id === photo.id}
                  onRemove={() => removePhoto(photo.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          state.photos.map((photo) => (
            <div key={photo.id} className="group relative w-20 shrink-0 hover:z-10">
              <div
                className={cn(
                  "rounded-lg border border-zinc-700",
                  activeCropPhoto?.id === photo.id &&
                    "border-blue-400 ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950",
                )}
              >
                <img
                  src={photo.objectUrl}
                  alt={photo.name}
                  decoding="async"
                  loading="lazy"
                  className="h-[78px] w-[78px] rounded-[7px] object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className={cn(
                  pressable,
                  "absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700",
                )}
                aria-label={`Remove ${photo.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="mt-1 truncate text-[10px] text-zinc-500" title={photo.name}>
                {photo.name}
              </p>
            </div>
          ))
        )}
        {state.photos.length === 0 && (
          <button
            type="button"
            onClick={pickPhotos}
            disabled={importing}
            aria-busy={importing}
            className={cn(
              pressable,
              "flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-600 bg-zinc-900/50 px-6 py-10 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-200 active:border-zinc-400 active:bg-zinc-800/80 sm:min-h-40",
              importing && "cursor-wait border-zinc-500 bg-zinc-900/70 text-zinc-300",
            )}
          >
            {importing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                <span className="text-xs">Processing photos…</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Tap or drop photos here</span>
              </>
            )}
          </button>
        )}
        {state.photos.length > 0 && state.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={pickPhotos}
            disabled={importing}
            aria-busy={importing}
            aria-label={importing ? "Processing photos" : "Add more photos"}
            className={cn(
              pressable,
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-300 active:border-zinc-300 active:bg-zinc-800/80",
              importing && "cursor-wait border-zinc-500 bg-zinc-900/60 text-zinc-400",
            )}
          >
            {importing ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}
