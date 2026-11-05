"use client";

import { Squircle } from "@squircle-js/react";
import { cn } from "@/lib/utils";

export const OPEN_EVENT = "pixelui:command-menu";
export const CLOSE_EVENT = "pixelui:command-menu-close";

export interface CommandMenuOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

let lastOrigin: CommandMenuOrigin | null = null;

export const setCommandMenuOrigin = (origin: CommandMenuOrigin | null) => {
  lastOrigin = origin;
};

export const getCommandMenuOrigin = () => lastOrigin;

export const getSearchBarRect = (): CommandMenuOrigin | null => {
  if (typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>("[data-command-search-bar]");
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
};

export const openCommandMenu = (origin?: CommandMenuOrigin | null) => {
  const resolved = origin ?? getSearchBarRect();
  setCommandMenuOrigin(resolved);
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT, { detail: { origin: resolved } }),
  );
};

export const closeCommandMenu = () => {
  setCommandMenuOrigin(null);
  window.dispatchEvent(new Event(CLOSE_EVENT));
};

export const preloadCommandMenu = () => void import("./CommandMenu");

export const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    aria-hidden
    className={className}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export function CommandMenuTrigger({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Squircle asChild cornerRadius={9} cornerSmoothing={1}>
      <button
        type="button"
        aria-label="Search components"
        aria-keyshortcuts="Meta+K Control+K"
        onPointerEnter={preloadCommandMenu}
        onFocus={preloadCommandMenu}
        onClick={() => {
          onClick?.();
          openCommandMenu();
        }}
        className={cn(
          "flex h-7 min-w-7 shrink-0 cursor-pointer items-center justify-center bg-[#F4F4F9] px-2 text-[12px] font-semibold text-[#868593] outline-none transition-[color,transform] duration-200 hover:text-black focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60 active:scale-95 motion-reduce:transition-none dark:bg-popover dark:hover:text-white",
          className,
        )}
      >
        <SearchIcon className="size-3.5 [@media(hover:hover)]:hidden" />
        <kbd className="hidden tracking-wide [@media(hover:hover)]:inline">
          ⌘K
        </kbd>
      </button>
    </Squircle>
  );
}
