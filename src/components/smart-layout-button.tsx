"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  apiPayloadToPlan,
  buildSmartLayoutRequestPhotos,
  type SmartLayoutApiPayload,
} from "@/lib/smart-layout";
import { useProject } from "@/lib/project-context";
import type { ProjectState } from "@/lib/types";
import { cn, pressable } from "@/lib/utils";

type DialogPhase = "confirm" | "loading" | "error";

export function SmartLayoutButton() {
  const { state, applySmartLayout, restoreState } = useProject();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DialogPhase>("confirm");
  const [errorMessage, setErrorMessage] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState<ProjectState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photoCount = state.photos.length;
  const canRun = photoCount >= 2;

  const clearUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoSnapshot(null);
  }, []);

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const runSmartLayout = useCallback(async () => {
    setPhase("loading");
    setErrorMessage("");

    try {
      const requestPhotos = await buildSmartLayoutRequestPhotos(state.photos);
      const slideRoles = state.slides.map(
        (s) => s.layeredPrints?.role ?? `slide-${s.cells[0]?.photoId ?? "empty"}`,
      );

      const res = await fetch("/api/smart-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: requestPhotos,
          templateId: state.templateId,
          slideRoles,
        }),
      });

      const body = (await res.json()) as SmartLayoutApiPayload & { error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? "Smart layout failed");
      }

      const plan = apiPayloadToPlan(body, state.photos, state.slides);
      if (!plan) {
        throw new Error("Could not parse layout suggestion");
      }

      setUndoSnapshot(structuredClone(state));
      applySmartLayout(plan);
      setOpen(false);
      setPhase("confirm");

      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(clearUndo, 12000);

      toast(plan.summary ?? "Smart layout applied");
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [applySmartLayout, clearUndo, state, toast]);

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    restoreState(undoSnapshot);
    clearUndo();
    toast("Layout restored");
  }, [clearUndo, restoreState, undoSnapshot, toast]);

  const openDialog = useCallback(() => {
    if (!canRun) return;
    setPhase("confirm");
    setErrorMessage("");
    setOpen(true);
  }, [canRun]);

  return (
    <>
      <div className="flex items-center gap-2" data-testid="smart-layout-actions">
        <button
          type="button"
          data-testid="smart-layout-button"
          disabled={!canRun}
          onClick={openDialog}
          title={canRun ? "AI suggests photo order, slides, and crops" : "Add at least 2 photos"}
          className={cn(
            pressable,
            "group relative isolate inline-flex min-h-8 shrink-0 items-center gap-2 overflow-hidden rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
            canRun && "active:scale-[0.98]",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400",
              canRun && "smart-layout-shimmer opacity-90",
            )}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[1.5px] rounded-[6.5px] bg-zinc-950/95"
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-[1.5px] rounded-[6.5px] opacity-0 transition-opacity duration-200",
              canRun && "group-hover:opacity-100 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-400/10",
            )}
          />
          <Sparkles
            className={cn(
              "relative h-4 w-4 shrink-0 text-violet-200 drop-shadow-[0_0_6px_rgba(167,139,250,0.55)]",
              canRun && "motion-safe:animate-[smart-layout-twinkle_2.4s_ease-in-out_infinite]",
            )}
            strokeWidth={1.75}
          />
          <span className="relative bg-gradient-to-r from-violet-100 via-white to-cyan-100 bg-clip-text text-transparent">
            Smart layout
          </span>
        </button>

        {undoSnapshot && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="smart-layout-undo"
            onClick={handleUndo}
            className="shrink-0 border-zinc-600 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/80"
          >
            Undo layout
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px]">
          <div className="overflow-hidden rounded-xl border border-violet-500/30 bg-zinc-900 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
            <div className="border-b border-violet-500/20 bg-gradient-to-r from-violet-950/80 via-zinc-900 to-cyan-950/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-300" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-zinc-50">Smart layout</h2>
              </div>
              <p className="mt-1.5 text-sm text-zinc-400">
                AI arranges photos, slides, and crops for your carousel.
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              {phase === "confirm" && (
                <>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    Thumbnails of your {photoCount} photos are sent to Google Gemini to suggest
                    order and positioning. Originals stay on your device.
                  </p>
                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <button
                      type="button"
                      onClick={() => void runSmartLayout()}
                      className={cn(
                        pressable,
                        "relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-medium",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
                        "active:scale-[0.98]",
                      )}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 smart-layout-shimmer"
                      />
                      <span className="relative flex items-center gap-1.5 text-white">
                        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                        Arrange
                      </span>
                    </button>
                  </div>
                </>
              )}

              {phase === "loading" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                  <p className="text-sm text-zinc-300">Studying your photos…</p>
                  <p className="text-xs text-zinc-500">Usually a few seconds</p>
                </div>
              )}

              {phase === "error" && (
                <>
                  <p className="text-sm text-red-300">{errorMessage}</p>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                    <Button className="flex-1" onClick={() => void runSmartLayout()}>
                      Retry
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
