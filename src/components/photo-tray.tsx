"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_PHOTOS } from "@/lib/constants";
import { useProject } from "@/lib/project-context";
import { useToast } from "@/components/ui/toast";
import { cn, pressable } from "@/lib/utils";

export function PhotoTray() {
  const { state, addPhotos, removePhoto } = useProject();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      setImporting(true);
      void addPhotos(accepted)
        .then(({ added, rejected, limitHit }) => {
          if (rejected > 0) {
            toast(`${rejected} duplicate file${rejected > 1 ? "s" : ""} skipped`);
          }
          if (limitHit) {
            toast(`Instagram allows up to ${MAX_PHOTOS} photos per carousel`);
          }
          if (added === 0 && rejected === 0 && limitHit) {
            toast(`Maximum ${MAX_PHOTOS} photos reached`);
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-zinc-300">
          Your photos · {state.photos.length} selected
        </h2>
        {state.photos.length < MAX_PHOTOS && (
          <Button variant="secondary" size="sm" onClick={pickPhotos} disabled={importing}>
            {importing ? "Processing…" : "Add photos"}
          </Button>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`flex gap-2 overflow-x-auto pb-2 ${isDragActive ? "ring-2 ring-blue-500 rounded-xl p-2" : ""}`}
      >
        <input {...getInputProps()} />
        {state.photos.map((photo) => (
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
                "absolute right-1 top-1 z-10 rounded-full border border-zinc-600 bg-zinc-900/90 p-0.5 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700",
              )}
              aria-label={`Remove ${photo.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
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
