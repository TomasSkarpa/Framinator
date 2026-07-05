"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Film, Hash, Image } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { renderSlidePreviewDataUrl } from "@/lib/canvas-render";
import { useProject } from "@/lib/project-context";
import { buildSlides, TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ReactNode> = {
  frame: <Hash className="h-5 w-5" />,
  carousel: <Image className="h-5 w-5" />,
  film: <Film className="h-5 w-5" />,
};

function TemplatePreview({
  templateId,
}: {
  templateId: TemplateId;
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
      slideIndex: 0,
    }).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [templateId, state.photos, state.filter, state.borderWidth, state.aspectRatio]);

  if (!url) {
    return <div className="aspect-[4/5] w-full animate-pulse rounded-md bg-zinc-800" />;
  }
  return (
    <img
      src={url}
      alt=""
      className="aspect-[4/5] w-full rounded-md object-cover"
    />
  );
}

export function TemplatePicker() {
  const { state, setTemplate } = useProject();
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
  }, [state.templateId]);

  if (state.photos.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-zinc-300">Choose a template</h2>
      <div className="-mx-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x snap-mandatory gap-3">
          {TEMPLATES.map((t) => {
            const selected = state.templateId === t.id;
            return (
              <button
                key={t.id}
                ref={selected ? selectedRef : undefined}
                type="button"
                onClick={() => setTemplate(t.id)}
                className="w-[min(72vw,200px)] shrink-0 snap-center text-left"
                data-testid={`template-${t.id}`}
              >
                <Card
                  className={cn(
                    "transition-colors hover:border-zinc-600",
                    selected && "border-blue-500 ring-1 ring-blue-500",
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
