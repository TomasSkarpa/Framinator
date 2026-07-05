"use client";

import { InstagramProfilePreview } from "@/components/instagram-profile-preview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        data-testid="profile-preview-overlay"
        aria-label="Instagram profile preview"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <InstagramProfilePreview
          avatarUrl={avatarUrl}
          latestPostUrl={latestPostUrl}
          onBack={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
