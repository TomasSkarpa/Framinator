"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { LivePreview } from "@/components/carousel-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useProject } from "@/lib/project-context";

export function LivePreviewButton() {
  const { state } = useProject();
  const [open, setOpen] = useState(false);

  if (!state.templateId || state.slides.length === 0) return null;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} data-testid="live-preview-button">
        <Eye className="h-4 w-4" />
        Preview
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92dvh] w-[min(520px,94vw)] max-w-none overflow-y-auto border-zinc-800 bg-zinc-950 p-4 sm:p-6"
          data-testid="live-preview-overlay"
          aria-label="Live preview"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <h2 className="text-lg font-semibold text-zinc-50">Live preview</h2>
          <LivePreview />
        </DialogContent>
      </Dialog>
    </>
  );
}
