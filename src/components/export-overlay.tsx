"use client";

import { Download, Share2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { exportHeight, EXPORT_WIDTH } from "@/lib/constants";
import {
  blobToFile,
  canShareFiles,
  downloadBlob,
  downloadRenderedSlidesZip,
  renderAllSlides,
  revokeRenderedSlides,
  shareFiles,
  type RenderedSlide,
} from "@/lib/export";
import { useProject } from "@/lib/project-context";
import { useToast } from "@/components/ui/toast";
import { cn, pressable } from "@/lib/utils";

type ExportOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function ExportOverlay({ open, onClose }: ExportOverlayProps) {
  const { state } = useProject();
  const { toast } = useToast();
  const [rendered, setRendered] = useState<RenderedSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);

  const project = useMemo(
    () =>
      state.templateId
        ? {
            filter: state.filter,
            borderWidth: state.borderWidth,
            templateId: state.templateId,
            aspectRatio: state.aspectRatio,
          }
        : null,
    [state.filter, state.borderWidth, state.templateId, state.aspectRatio],
  );

  const aspect = project
    ? `${EXPORT_WIDTH}/${exportHeight(project.aspectRatio)}`
    : "4/5";

  const shareableFiles = useMemo(
    () => (rendered.length > 0 ? rendered.map((s) => blobToFile(s.blob, s.filename)) : []),
    [rendered],
  );

  const canShareAll = shareableFiles.length > 0 && canShareFiles(shareableFiles);

  useEffect(() => {
    if (!open) {
      setRendered((prev) => {
        revokeRenderedSlides(prev);
        return [];
      });
      return;
    }
    if (!project || state.slides.length === 0) return;

    let cancelled = false;
    setLoading(true);
    void renderAllSlides(state.slides, state.photos, project, "jpeg")
      .then((slides) => {
        if (!cancelled) setRendered(slides);
      })
      .catch(() => {
        if (!cancelled) toast("Could not render slides");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, project, state.slides, state.photos, toast]);

  const handleSave = useCallback((slide: RenderedSlide) => {
    downloadBlob(slide.blob, slide.filename);
  }, []);

  const handleShare = useCallback(
    async (slide: RenderedSlide) => {
      const file = blobToFile(slide.blob, slide.filename);
      if (!canShareFiles([file])) {
        downloadBlob(slide.blob, slide.filename);
        return;
      }
      try {
        await shareFiles([file], `Slide ${slide.index + 1}`);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast("Share failed");
      }
    },
    [toast],
  );

  const handleShareAll = useCallback(async () => {
    if (!canShareAll) return;
    try {
      await shareFiles(shareableFiles, "Framinator carousel");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast("Share failed");
    }
  }, [canShareAll, shareableFiles, toast]);

  const handleZip = useCallback(async () => {
    if (rendered.length === 0) return;
    setZipBusy(true);
    try {
      await downloadRenderedSlidesZip(rendered);
      toast(`Downloaded ${rendered.length} slides as ZIP`);
    } catch {
      toast("ZIP export failed");
    } finally {
      setZipBusy(false);
    }
  }, [rendered, toast]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="top-[4dvh] flex h-[92dvh] w-[min(560px,92vw)] max-w-none translate-y-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-0"
        data-testid="export-overlay"
        aria-label="Export slides"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Export slides</h2>
            <p className="text-xs text-zinc-500">
              {state.slides.length} slide{state.slides.length === 1 ? "" : "s"} · 1080px JPEG
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              pressable,
              "rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700",
            )}
            aria-label="Close export"
            data-testid="export-overlay-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="shrink-0 border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
          Long-press an image to save to Photos. Or use Save / Share on each slide.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-4">
              {state.slides.map((slide) => (
                <div
                  key={slide.id}
                  className="animate-pulse rounded-lg bg-zinc-800"
                  style={{ aspectRatio: aspect }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {rendered.map((slide) => (
                <article
                  key={slide.index}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
                  data-testid={`export-slide-${slide.index + 1}`}
                >
                  <div className="relative bg-zinc-900">
                    <img
                      src={slide.previewUrl}
                      alt={`Slide ${slide.index + 1}`}
                      className="w-full object-contain"
                      style={{ aspectRatio: aspect }}
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                      {slide.index + 1}
                    </span>
                  </div>
                  <div className="flex gap-2 border-t border-zinc-800 p-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSave(slide)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => void handleShare(slide)}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-zinc-800 p-4">
          {canShareAll && (
            <Button className="flex-1" onClick={() => void handleShareAll()} data-testid="export-share-all">
              <Share2 className="h-4 w-4" />
              Share all
            </Button>
          )}
          <Button
            variant="secondary"
            className="flex-1"
            disabled={loading || zipBusy}
            onClick={() => void handleZip()}
            data-testid="export-download-zip"
          >
            <Download className="h-4 w-4" />
            {zipBusy ? "Zipping…" : "Download ZIP"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
