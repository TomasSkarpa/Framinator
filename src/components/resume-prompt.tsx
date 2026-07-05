"use client";

import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/project-context";

export function ResumePrompt() {
  const { resumeAvailable, acceptResume, dismissResume } = useProject();

  if (!resumeAvailable) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-100">Resume project?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          You have an unfinished carousel saved on this device.
        </p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => void acceptResume()}>
            Resume
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => void dismissResume()}
          >
            Start fresh
          </Button>
        </div>
      </div>
    </div>
  );
}
