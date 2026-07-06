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
import { GripVertical, ImagePlus, X } from "lucide-react";
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
  onRemove,
}: {
  photo: PhotoItem;
  index: number;
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
      className={cn("group relative shrink-0 hover:z-10", isDragging && "z-20 opacity-80")}
      data-testid={`photo-tray-item-${index}`}
      data-photo-name={photo.name}
    >
      <img
        src={photo.objectUrl}
        alt={photo.name}
        decoding="async"
        loading="lazy"
        className="h-20 w-20 rounded-lg object-cover border border-zinc-700"
      />
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
    </div>
  );
}

export function PhotoTray() {
  const { state, addPhotos, removePhoto, reorderPhotos } = useProject();
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
        .then(({ added, rejected, limitHit }) => {
          if (rejected > 0) {
            toast(`${rejected} duplicate file${rejected > 1 ? "s" : ""} skipped`);
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
  });

  const pickPhotos = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      open();
    },
    [open],
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
        <div className="flex shrink-0 items-center gap-2">
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
          Drag photos to set fill order. Leftmost fills the first frame.
        </p>
      )}

      <div
        {...getRootProps()}
        className={`flex gap-2 overflow-x-auto pb-2 ${isDragActive ? "ring-2 ring-blue-500 rounded-xl p-2" : ""}`}
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
                  onRemove={() => removePhoto(photo.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          state.photos.map((photo, index) => (
            <div key={photo.id} className="group relative shrink-0 hover:z-10">
              <img
                src={photo.objectUrl}
                alt={photo.name}
                decoding="async"
                loading="lazy"
                className="h-20 w-20 rounded-lg object-cover border border-zinc-700"
              />
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
            </div>
          ))
        )}
        {state.photos.length === 0 && (
          <button
            type="button"
            onClick={pickPhotos}
            className={cn(
              pressable,
              "flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-600 bg-zinc-900/50 px-6 py-10 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-200 active:border-zinc-400 active:bg-zinc-800/80 sm:min-h-40",
            )}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Tap or drop photos here</span>
          </button>
        )}
        {state.photos.length > 0 && state.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={pickPhotos}
            className={cn(
              pressable,
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-300 active:border-zinc-300 active:bg-zinc-800/80",
            )}
            aria-label="Add more photos"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
