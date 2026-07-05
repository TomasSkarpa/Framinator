"use client";

import { Slider } from "@/components/ui/slider";
import { useProject } from "@/lib/project-context";
import type { FilterPreset } from "@/lib/types";

const FILTERS: { id: FilterPreset; label: string }[] = [
  { id: "none", label: "None" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "bw", label: "B&W" },
  { id: "vintage", label: "Vintage" },
];

export function CustomizationPanel() {
  const { state, setFilter, setBorder, setAspect, updateCrop, unusedPhotos, assignPhoto } =
    useProject();

  if (!state.templateId) return null;

  const activePhotoId = state.slides[0]?.cells[0]?.photoId;
  const activePhoto = state.photos.find((p) => p.id === activePhotoId);

  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium text-zinc-300">Customize</h2>

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
        <label className="text-xs text-zinc-400">Filter (all slides)</label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
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

      {activePhoto && (
        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Crop focal point</label>
          <div className="grid grid-cols-2 gap-2">
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
      )}

      {unusedPhotos.length > 0 && state.slides.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Unused photos · tap to assign to slide 1</label>
          <div className="flex gap-2 overflow-x-auto">
            {unusedPhotos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => assignPhoto(state.slides[0].id, p.id)}
                className="shrink-0"
              >
                <img
                  src={p.objectUrl}
                  alt={p.name}
                  className="h-14 w-14 rounded-md object-cover border border-zinc-600 hover:border-blue-500"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
