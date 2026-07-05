"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Grid2X2, Hash, Image, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { renderSlidePreviewDataUrl } from "@/lib/canvas-render";
import { useProject } from "@/lib/project-context";
import { buildSlides, TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ReactNode> = {
  grid: <Grid2X2 className="h-5 w-5" />,
  frame: <Hash className="h-5 w-5" />,
  carousel: <Image className="h-5 w-5" />,
  story: <Layers className="h-5 w-5" />,
};

function TemplatePreview({
  templateId,
  compact = false,
}: {
  templateId: TemplateId;
  compact?: boolean;
}) {
  const { state } = useProject();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.photos.length === 0) return;
    const slides = buildSlides(templateId, state.photos);
    const first = slides[0];
    if (!first) return;
    const map = new Map(state.photos.map((p) => [p.id, p]));
    let cancelled = false;
    void renderSlidePreviewDataUrl(first, map, {
      filter: state.filter,
      borderWidth: state.borderWidth,
      templateId,
      aspectRatio: state.aspectRatio,
    }).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [templateId, state.photos, state.filter, state.borderWidth, state.aspectRatio]);

  if (!url) {
    return (
      <div
        className={cn(
          "rounded-md bg-zinc-800 animate-pulse",
          compact ? "h-full w-full" : "aspect-[4/5] w-full",
        )}
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={cn(
        "object-cover",
        compact ? "h-full w-full" : "aspect-[4/5] w-full rounded-md",
      )}
    />
  );
}

export function TemplatePicker() {
  const { state, setTemplate } = useProject();
  const [expanded, setExpanded] = useState(() => !state.templateId);
  const selected = TEMPLATES.find((t) => t.id === state.templateId);

  useEffect(() => {
    if (!state.templateId) setExpanded(true);
  }, [state.templateId]);

  if (state.photos.length === 0) return null;

  const pickTemplate = (id: TemplateId) => {
    setTemplate(id);
    setExpanded(false);
  };

  if (!expanded && selected) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-300">Template</h2>
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-zinc-700">
            <TemplatePreview templateId={selected.id} compact />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-zinc-200">
              {ICONS[selected.icon]}
              <span className="truncate text-sm font-medium">{selected.name}</span>
            </div>
            <p className="truncate text-xs text-zinc-500">{selected.description}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setExpanded(true)}>
            Change
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-300">Choose a template</h2>
        {state.templateId && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <ChevronDown className="h-4 w-4" aria-hidden />
            Hide
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pickTemplate(t.id)}
            className="text-left"
          >
            <Card
              className={cn(
                "transition-colors hover:border-zinc-600",
                state.templateId === t.id && "border-blue-500 ring-1 ring-blue-500",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-zinc-200">
                  {ICONS[t.icon]}
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                </div>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplatePreview templateId={t.id} />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
