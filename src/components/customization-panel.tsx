"use client";

import { useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { FILTERS } from "@/lib/filters";
import { preloadLuts } from "@/lib/lut";
import { useProject } from "@/lib/project-context";

export function CustomizationPanel() {
  const {
    state,
    selectedSlide,
    selectedSlideIndex,
    setFilter,
    setBorder,
    setAspect,
    updateCrop,
  } = useProject();

  useEffect(() => {
    preloadLuts();
  }, []);

  if (!state.templateId) return null;

  const photoId = selectedSlide?.cells[0]?.photoId;
  const activePhoto = photoId ? state.photos.find((p) => p.id === photoId) : undefined;

  return (
    <section className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div>
        <h2 className="text-sm font-medium text-zinc-300">
          Customize
          {selectedSlide && (
            <span className="text-zinc-500"> · slide {selectedSlideIndex + 1}</span>
          )}
        </h2>
      </div>

      {activePhoto ? (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <label className="text-xs font-medium text-zinc-300">This slide</label>
          <p className="text-[11px] text-zinc-500">Crop and zoom for slide {selectedSlideIndex + 1}</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-zinc-500">Horizontal</span>
              <Slider
                min={-200}
                max={200}
                step={1}
                value={[activePhoto.crop.offsetX]}
                onValueChange={([v]) =>
                  updateCrop(activePhoto.id, { ...activePhoto.crop, offsetX: v })
                }
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500">Vertical</span>
              <Slider
                min={-200}
                max={200}
                step={1}
                value={[activePhoto.crop.offsetY]}
                onValueChange={([v]) =>
                  updateCrop(activePhoto.id, { ...activePhoto.crop, offsetY: v })
                }
              />
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-zinc-500">Zoom</span>
              <Slider
                min={1}
                max={2}
                step={0.01}
                value={[activePhoto.crop.scale]}
                onValueChange={([v]) =>
                  updateCrop(activePhoto.id, { ...activePhoto.crop, scale: v })
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Select a slide above to adjust its crop.</p>
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
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  state.aspectRatio === a
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
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
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  state.filter === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {(state.templateId === "framed-polaroid" || state.templateId === "story-arc") && (
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
