import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Tap/hover/focus for native <button> outside the Button component. */
export const pressable =
  "cursor-pointer transition-[color,transform,background-color,border-color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export function uid(): string {
  return crypto.randomUUID();
}
