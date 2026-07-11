"use client";

import { CarouselPreview } from "@/components/carousel-preview";
import { CustomizationPanel } from "@/components/customization-panel";
import { ExportButton } from "@/components/export-button";
import { LivePreviewButton } from "@/components/live-preview-button";
import { ProfilePreviewButton } from "@/components/profile-preview-button";
import { PhotoTray } from "@/components/photo-tray";
import { ResumePrompt } from "@/components/resume-prompt";
import { TemplatePicker } from "@/components/template-picker";
import { ProjectProvider } from "@/lib/project-context";
import { getBrandConfig, type BrandConfig } from "@/lib/brands";

function BuilderShell({ brand }: { brand: BrandConfig | null }) {
  return (
    <>
      <ResumePrompt />
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-4 sm:py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-50">
              {brand?.name ?? "Framinator"}
            </h1>
            <p className="text-sm text-zinc-500">
              {brand?.subtitle ?? "Carousel builder"}
            </p>
          </div>
          <div className="flex gap-2">
            <LivePreviewButton />
            <ProfilePreviewButton />
            <ExportButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:py-10">
        <PhotoTray />
        <TemplatePicker />
        <CarouselPreview />
        <CustomizationPanel />
      </main>

      <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] text-center text-[11px] text-zinc-500">
        All compositing runs in your browser. Photos never leave your device.
      </footer>
    </>
  );
}

export function Builder({
  brandId,
}: {
  brandId?: string;
}) {
  const brand = getBrandConfig(brandId);

  return (
    <ProjectProvider brandId={brand?.id}>
      <BuilderShell brand={brand} />
    </ProjectProvider>
  );
}
