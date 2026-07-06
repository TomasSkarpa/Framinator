"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cropAfterPan, cropAfterZoom, drawCover } from "@/lib/crop-math";
import type { CropFrameRect } from "@/lib/slide-crop";
import type { PhotoCrop, PhotoItem } from "@/lib/types";
import { cn, pressable } from "@/lib/utils";

type CropOverlayProps = {
  photo: PhotoItem;
  crop: PhotoCrop;
  frame: CropFrameRect;
  onCropChange: (crop: PhotoCrop) => void;
  onDone: () => void;
  label?: string;
};

export function CropOverlay({
  photo,
  crop,
  frame,
  onCropChange,
  onDone,
  label,
}: CropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = photo.objectUrl;
  }, [photo.objectUrl]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const framePx = {
    x: (frame.xPct / 100) * size.w,
    y: (frame.yPct / 100) * size.h,
    w: (frame.wPct / 100) * size.w,
    h: (frame.hPct / 100) * size.h,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || framePx.w <= 0 || framePx.h <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(framePx.w * dpr));
    canvas.height = Math.max(1, Math.round(framePx.h * dpr));
    canvas.style.width = `${framePx.w}px`;
    canvas.style.height = `${framePx.h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, framePx.w, framePx.h);
    drawCover(ctx, img, crop, 0, 0, framePx.w, framePx.h);
  }, [img, crop, framePx.w, framePx.h, framePx.x, framePx.y]);

  const pan = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!img) return;
      onCropChange(
        cropAfterPan(crop, deltaX, deltaY, framePx.w, framePx.h, img.naturalWidth, img.naturalHeight),
      );
    },
    [crop, framePx.h, framePx.w, img, onCropChange],
  );

  const zoom = useCallback(
    (factor: number) => {
      if (!img) return;
      onCropChange(
        cropAfterZoom(crop, factor, framePx.w, framePx.h, img.naturalWidth, img.naturalHeight),
      );
    },
    [crop, framePx.h, framePx.w, img, onCropChange],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = dragRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (dx !== 0 || dy !== 0) {
        pan(dx, dy);
        dragRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [pan],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06;
      zoom(factor);
    },
    [zoom],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      data-testid="crop-overlay"
      data-crop-label={label ?? "Photo"}
    >
      <div
        className="absolute overflow-hidden rounded-sm ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent"
        style={{
          left: framePx.x,
          top: framePx.y,
          width: framePx.w,
          height: framePx.h,
        }}
      >
        <canvas
          ref={canvasRef}
          className={cn("block h-full w-full touch-none", pressable)}
          aria-label={`Crop ${label ?? "photo"}: drag to reposition, scroll to zoom`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center px-3">
        <p className="rounded-full bg-black/70 px-3 py-1 text-center text-[11px] text-white">
          Drag to reposition · scroll or pinch to zoom
          {label ? ` · ${label}` : ""}
        </p>
      </div>

      <div className="absolute bottom-2 right-2">
        <Button
          type="button"
          size="sm"
          data-testid="crop-done"
          className="shadow-lg"
          onClick={onDone}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
