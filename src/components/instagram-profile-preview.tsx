"use client";

import {
  ChevronLeft,
  Clapperboard,
  Grid3x3,
  MoreHorizontal,
  PlusCircle,
  UserSquare2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const IG_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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
      className="mx-auto w-full max-w-[400px] rounded-md border border-gray-200 bg-white"
      style={{ fontFamily: IG_FONT }}
      data-testid="instagram-profile-preview"
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className={cn(onBack && "cursor-pointer")}
          aria-label={onBack ? "Close profile preview" : undefined}
          data-testid="profile-preview-close"
        >
          <ChevronLeft size={20} className="text-gray-900" />
        </button>
        <div className="flex items-center gap-1 text-[15px] font-semibold text-gray-900">
          {username}
          {verified && (
            <svg width="12" height="12" viewBox="0 0 40 40" className="ml-0.5" aria-hidden>
              <path
                fill="#3897f0"
                d="M19.998 3.094 24.322 0l2.531 5.026 5.539-1.212.9 5.594 5.592.902-1.211 5.54L42.7 13.38l-3.095 4.62L42.7 22.62l-5.026 2.532 1.211 5.539-5.592.902-.9 5.594-5.539-1.212L24.322 40l-4.324-3.095L15.674 40l-2.531-5.026-5.539 1.212-.9-5.594-5.592-.902 1.211-5.54L-.7 22.62l3.095-4.62L-.7 13.38l5.026-2.532-1.211-5.539 5.592-.902.9-5.594 5.539 1.212L19.998 3.094Z"
              />
              <path fill="#fff" d="m17.5 25.5-5-5 1.8-1.8 3.2 3.2 7.2-7.2 1.8 1.8-9 9Z" />
            </svg>
          )}
        </div>
        <MoreHorizontal size={20} className="text-gray-900" aria-hidden />
      </div>

      <div className="flex items-center gap-6 px-4 pt-1">
        <img
          src={avatarUrl}
          alt=""
          className="h-[70px] w-[70px] rounded-full object-cover"
          data-testid="profile-preview-avatar"
        />
        <div className="flex flex-1 justify-between text-center">
          <div>
            <p className="text-[15px] font-semibold text-gray-900">{posts}</p>
            <p className="text-[12px] text-gray-500">Posts</p>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">{followers}</p>
            <p className="text-[12px] text-gray-500">Followers</p>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">{following}</p>
            <p className="text-[12px] text-gray-500">Following</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-2.5 text-[13px] leading-snug">
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

      <div className="flex gap-1.5 px-4 pt-3">
        <button
          type="button"
          className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[13px] font-semibold text-white"
        >
          Follow
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-gray-100 py-1.5 text-[13px] font-semibold text-gray-900"
        >
          Message
        </button>
        <button
          type="button"
          className="flex items-center justify-center rounded-lg bg-gray-100 px-2.5"
          aria-hidden
        >
          <PlusCircle size={16} className="text-gray-900" />
        </button>
      </div>

      <div className="mt-3 flex border-t border-gray-200">
        <div className="flex flex-1 justify-center border-t border-gray-900 py-2.5">
          <Grid3x3 size={20} className="text-gray-900" />
        </div>
        <div className="flex flex-1 justify-center py-2.5">
          <Clapperboard size={20} className="text-gray-400" />
        </div>
        <div className="flex flex-1 justify-center py-2.5">
          <UserSquare2 size={20} className="text-gray-400" />
        </div>
      </div>

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
  );
}
