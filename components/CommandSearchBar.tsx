"use client";

import { Squircle } from "@squircle-js/react";
import { cn } from "@/lib/utils";
import {
  openCommandMenu,
  preloadCommandMenu,
  SearchIcon,
} from "./CommandMenuTrigger";

export function CommandSearchBar({ className }: { className?: string }) {
  return (
    <div
      data-chrome
      className={cn(
        "pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center px-4",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Search components"
        aria-keyshortcuts="Meta+K Control+K"
        onPointerEnter={preloadCommandMenu}
        onFocus={preloadCommandMenu}
        onClick={openCommandMenu}
        className="pointer-events-auto group flex h-11 w-full max-w-[calc(100%-6.5rem)] cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-muted px-3.5 shadow-sm transition-[border-color,background-color] hover:border-black/10 sm:max-w-sm dark:border-transparent dark:border-apple dark:hover:border-apple/80"
      >
        <span className="flex min-w-0 items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
          <SearchIcon className="size-4 shrink-0" />
          <span className="truncate font-runde text-[13px] font-medium text-[#868593] dark:text-[#A1A0AB]">
            <span className="hidden sm:inline">Search components...</span>
            <span className="sm:hidden">Search...</span>
          </span>
        </span>

        <Squircle asChild cornerRadius={8} cornerSmoothing={1}>
          <kbd className="flex h-7 min-w-7 shrink-0 items-center justify-center bg-popover px-2 font-runde text-[11px] font-semibold text-[#868593] shadow-xs transition-colors group-hover:text-black dark:text-[#A1A0AB] dark:group-hover:text-white">
            ⌘K
          </kbd>
        </Squircle>
      </button>
    </div>
  );
}
