"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportOverlay } from "@/components/export-overlay";
import { useProject } from "@/lib/project-context";

export function ExportButton() {
  const { state } = useProject();
  const [open, setOpen] = useState(false);

  const canExport =
    state.templateId && state.slides.length > 0 && state.photos.length > 0;

  return (
    <>
      <Button disabled={!canExport} onClick={() => setOpen(true)} data-testid="export-button">
        <Download className="h-4 w-4" />
        Export
      </Button>
      <ExportOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
