"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CROP_SCALE_MAX, CROP_SCALE_MIN, DEFAULT_PHOTO_CROP } from "@/lib/constants";
import { FILTERS } from "@/lib/filters";
import { preloadLuts } from "@/lib/lut";
import { useProject } from "@/lib/project-context";
import type { CropPlacementKey } from "@/lib/slide-crop";
import { isFramedPolaroidTemplate } from "@/lib/templates";
import { usesPerSlideBrandOverlay } from "@/lib/brands";
import { cn, pressable } from "@/lib/utils";

export function CustomizationPanel() {
  const {
    state,
    selectedSlide,
    selectedSlideIndex,
    setFilter,
    setBorder,
    setAspect,
    updateCrop,
    activeCropPhoto,
    slideCropOptions,
    cropPlacementKey,
    setCropPlacement,
    setSlideOverlay,
  } = useProject();

  useEffect(() => {
    preloadLuts();
  }, []);

  if (!state.templateId) return null;

  const cropIsDefault =
    activeCropPhoto?.crop.offsetX === DEFAULT_PHOTO_CROP.offsetX &&
    activeCropPhoto?.crop.offsetY === DEFAULT_PHOTO_CROP.offsetY &&
    activeCropPhoto?.crop.scale === DEFAULT_PHOTO_CROP.scale;

  const showOverlayToggle =
    usesPerSlideBrandOverlay(state.templateId) && selectedSlide !== null;

  return (
    <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" data-testid="customization-panel">
      <div>
        <h2 className="text-sm font-medium text-zinc-300">
          Customize
          {selectedSlide && (
            <span className="text-zinc-500"> · slide {selectedSlideIndex + 1}</span>
          )}
        </h2>
      </div>

      {activeCropPhoto ? (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-zinc-300">Crop</label>
            <Button
              variant="ghost"
              size="sm"
              data-testid="crop-reset"
              disabled={cropIsDefault}
              onClick={() => updateCrop(activeCropPhoto.id, { ...DEFAULT_PHOTO_CROP })}
            >
              Reset position
            </Button>
          </div>

          {slideCropOptions.length > 1 && (
            <div className="flex flex-wrap gap-2" data-testid="slide-crop-photo-picker">
              {slideCropOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  data-testid={`crop-target-${opt.key}`}
                  onClick={() => setCropPlacement(opt.key as CropPlacementKey)}
                  className={cn(
                    pressable,
                    "rounded-lg px-2.5 py-1 text-xs",
                    cropPlacementKey === opt.key
                      ? "bg-blue-600 text-white active:bg-blue-700"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-zinc-500">
            {slideCropOptions.length > 1
              ? `Crop for ${slideCropOptions.find((o) => o.key === cropPlacementKey)?.label ?? "photo"} on slide ${selectedSlideIndex + 1}`
              : `Crop and zoom for slide ${selectedSlideIndex + 1}`}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1" data-testid="crop-sliders">
            <div>
              <span className="text-[10px] text-zinc-500">Horizontal</span>
              <Slider
                min={-200}
                max={200}
                step={1}
                data-testid="crop-slider-horizontal"
                value={[activeCropPhoto.crop.offsetX]}
                onValueChange={([v]) =>
                  updateCrop(activeCropPhoto.id, { ...activeCropPhoto.crop, offsetX: v })
                }
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500">Vertical</span>
              <Slider
                min={-200}
                max={200}
                step={1}
                data-testid="crop-slider-vertical"
                value={[activeCropPhoto.crop.offsetY]}
                onValueChange={([v]) =>
                  updateCrop(activeCropPhoto.id, { ...activeCropPhoto.crop, offsetY: v })
                }
              />
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-zinc-500">
                Zoom · {activeCropPhoto.crop.scale.toFixed(2)}×
              </span>
              <Slider
                min={CROP_SCALE_MIN}
                max={CROP_SCALE_MAX}
                step={0.01}
                data-testid="crop-slider-zoom"
                value={[activeCropPhoto.crop.scale]}
                onValueChange={([v]) =>
                  updateCrop(activeCropPhoto.id, { ...activeCropPhoto.crop, scale: v })
                }
              />
            </div>
          </div>
          <p
            className="text-[10px] text-zinc-600"
            data-testid="crop-offset-display"
            data-offset-x={activeCropPhoto.crop.offsetX}
            data-offset-y={activeCropPhoto.crop.offsetY}
            data-scale={activeCropPhoto.crop.scale}
          >
            offset {activeCropPhoto.crop.offsetX}, {activeCropPhoto.crop.offsetY} · scale{" "}
            {activeCropPhoto.crop.scale.toFixed(2)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Select a slide above to adjust its crop.</p>
      )}

      {showOverlayToggle && selectedSlide && (
        <label
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3"
          data-testid="slide-overlay-toggle"
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-950"
            checked={selectedSlide.overlayEnabled ?? false}
            onChange={(e) => setSlideOverlay(selectedSlide.id, e.target.checked)}
            data-testid="slide-overlay-checkbox"
          />
          <span className="text-xs font-medium text-zinc-300">Brand overlay</span>
          <span className="text-[11px] text-zinc-500">
            Apply the selected template frame to this slide
          </span>
        </label>
      )}

      <div className="space-y-4 border-t border-zinc-800 pt-4">
        <p className="text-xs font-medium text-zinc-300">All slides</p>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Aspect ratio</label>
          <div className="flex gap-2">
            {(["4:5", "1:1"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAspect(a)}
                className={cn(
                  pressable,
                  "rounded-lg px-3 py-1.5 text-sm",
                  state.aspectRatio === a
                    ? "bg-blue-600 text-white active:bg-blue-700"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600",
                )}
              >
                {a === "4:5" ? "1080×1350" : "1080×1080"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Film filter</label>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                title={f.description}
                onClick={() => setFilter(f.id)}
                className={cn(
                  pressable,
                  "rounded-lg px-3 py-1.5 text-sm",
                  state.filter === f.id
                    ? "bg-blue-600 text-white active:bg-blue-700"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isFramedPolaroidTemplate(state.templateId) && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">
              Border width · {state.borderWidth}px
            </label>
            <Slider
              min={4}
              max={32}
              step={1}
              value={[state.borderWidth]}
              onValueChange={([v]) => setBorder(v)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
