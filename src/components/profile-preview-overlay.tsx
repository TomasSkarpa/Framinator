"use client";

import { useEffect } from "react";
import { InstagramProfilePreview } from "@/components/instagram-profile-preview";
import { useProject } from "@/lib/project-context";
import { useSlidePreviewUrl } from "@/lib/use-slide-preview-url";

type ProfilePreviewOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfilePreviewOverlay({ open, onClose }: ProfilePreviewOverlayProps) {
  const { state } = useProject();
  const firstSlide = state.slides[0] ?? null;
  const latestPostUrl = useSlidePreviewUrl(firstSlide);
  const avatarUrl = state.photos[0]?.objectUrl ?? "https://i.pravatar.cc/120?img=12";

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      data-testid="profile-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Instagram profile preview"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <InstagramProfilePreview
          avatarUrl={avatarUrl}
          latestPostUrl={latestPostUrl}
          onBack={onClose}
        />
      </div>
    </div>
  );
}
