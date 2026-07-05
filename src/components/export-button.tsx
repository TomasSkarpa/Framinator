"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportSlides } from "@/lib/export";
import { useProject } from "@/lib/project-context";
import { useToast } from "@/components/ui/toast";

export function ExportButton() {
  const { state } = useProject();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const canExport =
    state.templateId && state.slides.length > 0 && state.photos.length > 0;

  async function handleExport(format: "jpeg" | "png") {
    if (!canExport || !state.templateId) return;
    setBusy(true);
    try {
      await exportSlides(state.slides, state.photos, {
        filter: state.filter,
        borderWidth: state.borderWidth,
        templateId: state.templateId,
        aspectRatio: state.aspectRatio,
      }, format);
      toast(`Exported ${state.slides.length} slides as ZIP`);
    } catch {
      toast("Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        disabled={!canExport || busy}
        onClick={() => void handleExport("jpeg")}
      >
        <Download className="h-4 w-4" />
        {busy ? "Exporting…" : "Export"}
      </Button>
    </div>
  );
}
