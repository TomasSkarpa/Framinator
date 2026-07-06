"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import { noticeDurationMs, type SmartLayoutNotice } from "@/lib/smart-layout";
import { cn, pressable } from "@/lib/utils";

type Props = {
  notice: SmartLayoutNotice;
  onDismiss: () => void;
};

export function SmartLayoutNoticePanel({ notice, onDismiss }: Props) {
  useEffect(() => {
    const ms = noticeDurationMs(notice);
    const timer = setTimeout(onDismiss, ms);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  return (
    <div
      role="status"
      data-testid="smart-layout-notice"
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[min(92vw,20rem)] rounded-xl border border-violet-500/35",
        "bg-zinc-900/95 px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles
          className="mt-0.5 h-4 w-4 shrink-0 text-violet-300"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-medium text-zinc-50">Smart layout</p>
          <div className="space-y-2.5 text-[13px] leading-relaxed text-zinc-300">
            <div>
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-violet-300/90">
                Your post
              </p>
              <p>{notice.postDescription}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-violet-300/90">
                Why
              </p>
              <p>{notice.whyArranged}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            pressable,
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500",
            "hover:bg-zinc-800 hover:text-zinc-200 active:bg-zinc-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
          )}
          aria-label="Dismiss explanation"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
