"use client";

import { CarouselPreview } from "@/components/carousel-preview";
import { CustomizationPanel } from "@/components/customization-panel";
import { ExportButton } from "@/components/export-button";
import { PhotoTray } from "@/components/photo-tray";
import { ResumePrompt } from "@/components/resume-prompt";
import { TemplatePicker } from "@/components/template-picker";

export function Builder() {
  return (
    <>
      <ResumePrompt />
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-4 sm:py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-50">Framinator</h1>
            <p className="text-sm text-zinc-500">Carousel builder</p>
          </div>
          <ExportButton />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 pb-28 sm:py-10">
        <PhotoTray />
        <TemplatePicker />
        <CarouselPreview />
        <CustomizationPanel />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] text-center text-[11px] text-zinc-500">
        All compositing runs in your browser. Photos never leave your device.
      </footer>
    </>
  );
}
