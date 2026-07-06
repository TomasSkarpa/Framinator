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
        "fixed bottom-4 right-4 z-50 w-[min(92vw,22rem)] rounded-xl border border-violet-500/35",
        "bg-zinc-900/95 px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles
          className="mt-0.5 h-4 w-4 shrink-0 text-violet-300"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium leading-snug text-zinc-50">{notice.headline}</p>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-zinc-300">
            {notice.details.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
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
