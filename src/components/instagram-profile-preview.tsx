"use client";

import {
  ChevronLeft,
  Clapperboard,
  Grid3x3,
  MoreHorizontal,
  PlusCircle,
  UserSquare2,
} from "lucide-react";
import { cn, pressable } from "@/lib/utils";

const IG_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Light-surface press states for the Instagram mockup card. */
const igPressable =
  "cursor-pointer transition-[color,transform,background-color] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

type InstagramProfilePreviewProps = {
  username?: string;
  displayName?: string;
  verified?: boolean;
  avatarUrl?: string;
  posts?: number;
  followers?: string;
  following?: number;
  bioLines?: string[];
  latestPostUrl?: string | null;
  placeholderCount?: number;
  onBack?: () => void;
};

export function InstagramProfilePreview({
  username = "yourbrand",
  displayName = "Your Brand",
  verified = true,
  avatarUrl = "https://i.pravatar.cc/120?img=12",
  posts = 265,
  followers = "974K",
  following = 444,
  bioLines = ["Artist", "writer of bops • face of @yourstudio", "linktr.ee/yourbrand"],
  latestPostUrl,
  placeholderCount = 8,
  onBack,
}: InstagramProfilePreviewProps) {
  const gridItems = [
    { real: true, url: latestPostUrl },
    ...Array.from({ length: placeholderCount }, () => ({ real: false, url: null as string | null })),
  ];

  return (
    <div
      className="mx-auto flex h-full w-full max-w-none flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
      style={{ fontFamily: IG_FONT }}
      data-testid="instagram-profile-preview"
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            onBack && igPressable,
            "rounded-lg p-1.5 text-gray-900 hover:bg-gray-100 active:bg-gray-200",
          )}
          aria-label={onBack ? "Close profile preview" : undefined}
          data-testid="profile-preview-close"
        >
          <ChevronLeft className="h-6 w-6 text-gray-900 sm:h-7 sm:w-7" />
        </button>
        <div className="flex items-center gap-1.5 text-lg font-semibold text-gray-900 sm:text-xl">
          {username}
          {verified && (
            <svg width="16" height="16" viewBox="0 0 40 40" className="ml-0.5 sm:h-5 sm:w-5" aria-hidden>
              <path
                fill="#3897f0"
                d="M19.998 3.094 24.322 0l2.531 5.026 5.539-1.212.9 5.594 5.592.902-1.211 5.54L42.7 13.38l-3.095 4.62L42.7 22.62l-5.026 2.532 1.211 5.539-5.592.902-.9 5.594-5.539-1.212L24.322 40l-4.324-3.095L15.674 40l-2.531-5.026-5.539 1.212-.9-5.594-5.592-.902 1.211-5.54L-.7 22.62l3.095-4.62L-.7 13.38l5.026-2.532-1.211-5.539 5.592-.902.9-5.594 5.539 1.212L19.998 3.094Z"
              />
              <path fill="#fff" d="m17.5 25.5-5-5 1.8-1.8 3.2 3.2 7.2-7.2 1.8 1.8-9 9Z" />
            </svg>
          )}
        </div>
        <MoreHorizontal className="h-6 w-6 text-gray-900 sm:h-7 sm:w-7" aria-hidden />
      </div>

      <div className="flex shrink-0 items-center gap-8 px-4 pt-1 sm:gap-10 sm:px-6 sm:pt-2">
        <img
          src={avatarUrl}
          alt=""
          className="h-[clamp(70px,12vh,160px)] w-[clamp(70px,12vh,160px)] rounded-full object-cover"
          data-testid="profile-preview-avatar"
        />
        <div className="flex flex-1 justify-between text-center">
          <div>
            <p className="text-base font-semibold text-gray-900 sm:text-xl">{posts}</p>
            <p className="text-sm text-gray-500 sm:text-base">Posts</p>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 sm:text-xl">{followers}</p>
            <p className="text-sm text-gray-500 sm:text-base">Followers</p>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 sm:text-xl">{following}</p>
            <p className="text-sm text-gray-500 sm:text-base">Following</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pt-3 text-sm leading-snug sm:px-6 sm:pt-4 sm:text-base">
        <p className="font-semibold text-gray-900">{displayName}</p>
        {bioLines.map((line, i) => (
          <p
            key={i}
            className={
              line.startsWith("http") || line.includes(".") ? "text-blue-900" : "text-gray-900"
            }
          >
            {line}
          </p>
        ))}
      </div>

      <div className="flex shrink-0 gap-2 px-4 pt-4 sm:gap-3 sm:px-6 sm:pt-5">
        <button
          type="button"
          className={cn(
            igPressable,
            "flex-1 rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 active:bg-blue-700 sm:py-3 sm:text-base",
          )}
        >
          Follow
        </button>
        <button
          type="button"
          className={cn(
            igPressable,
            "flex-1 rounded-lg bg-gray-100 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 active:bg-gray-300 sm:py-3 sm:text-base",
          )}
        >
          Message
        </button>
        <button
          type="button"
          className={cn(
            igPressable,
            "flex items-center justify-center rounded-lg bg-gray-100 px-3 hover:bg-gray-200 active:bg-gray-300 sm:px-4",
          )}
          aria-hidden
        >
          <PlusCircle className="h-5 w-5 text-gray-900 sm:h-6 sm:w-6" />
        </button>
      </div>

      <div className="mt-3 flex shrink-0 border-t border-gray-200 sm:mt-4">
        <div className="flex flex-1 justify-center border-t-2 border-gray-900 py-3 sm:py-4">
          <Grid3x3 className="h-6 w-6 text-gray-900 sm:h-7 sm:w-7" />
        </div>
        <div className="flex flex-1 justify-center py-3 sm:py-4">
          <Clapperboard className="h-6 w-6 text-gray-400 sm:h-7 sm:w-7" />
        </div>
        <div className="flex flex-1 justify-center py-3 sm:py-4">
          <UserSquare2 className="h-6 w-6 text-gray-400 sm:h-7 sm:w-7" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-[2px] bg-gray-200">
        {gridItems.map((item, i) =>
          item.real ? (
            <div key={i} className="aspect-square bg-gray-100" data-testid="profile-preview-latest-post">
              {item.url ? (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse bg-gray-200" />
              )}
            </div>
          ) : (
            <div key={i} className="aspect-square bg-gray-200" />
          ),
        )}
        </div>
      </div>
    </div>
  );
}
