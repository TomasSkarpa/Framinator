"use client";

import { UserSquare2 } from "lucide-react";
import { useState } from "react";
import { ProfilePreviewOverlay } from "@/components/profile-preview-overlay";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/project-context";

export function ProfilePreviewButton() {
  const { state } = useProject();
  const [open, setOpen] = useState(false);

  if (!state.templateId) return null;

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        data-testid="profile-preview-button"
      >
        <UserSquare2 className="h-4 w-4" />
        Profile
      </Button>
      <ProfilePreviewOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
