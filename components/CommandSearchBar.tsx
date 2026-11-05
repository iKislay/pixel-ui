"use client";

import { useEffect, useRef, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { cn } from "@/lib/utils";
import {
  CLOSE_EVENT,
  measureOrigin,
  OPEN_EVENT,
  openCommandMenu,
  preloadCommandMenu,
  SearchIcon,
} from "./CommandMenuTrigger";

export function CommandSearchBar({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener(CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener(CLOSE_EVENT, onClose);
    };
  }, []);

  const handleClick = () => {
    openCommandMenu(buttonRef.current && measureOrigin(buttonRef.current));
  };

  return (
    <div
      data-chrome
      className={cn(
        "pointer-events-none flex justify-center",
        className ?? "absolute inset-x-0 top-4 z-40 px-4",
      )}
    >
      <button
        ref={buttonRef}
        data-command-search-bar
        type="button"
        aria-label="Search components"
        aria-keyshortcuts="Meta+K Control+K"
        onPointerEnter={preloadCommandMenu}
        onFocus={preloadCommandMenu}
        onClick={handleClick}
        className={cn(
          "pointer-events-auto group flex h-11 w-full max-w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-muted px-3.5 shadow-sm transition-[border-color,background-color,opacity,transform] duration-200 hover:border-black/10 active:scale-[0.98] sm:max-w-[260px] dark:border-transparent dark:border-apple dark:hover:border-apple/80",
          buttonClassName,
          isOpen && "pointer-events-none opacity-0 duration-100",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
          <SearchIcon className="size-4 shrink-0" />
          <span className="truncate text-[13px] font-medium text-[#868593] dark:text-[#A1A0AB]">
            <span className="hidden sm:inline">Search components...</span>
            <span className="sm:hidden">Search...</span>
          </span>
        </span>

        <Squircle asChild cornerRadius={8} cornerSmoothing={1}>
          <kbd className="flex h-7 min-w-7 shrink-0 items-center justify-center bg-popover px-2 text-[11px] font-semibold text-[#868593] shadow-xs transition-colors group-hover:text-black dark:text-[#A1A0AB] dark:group-hover:text-white">
            ⌘K
          </kbd>
        </Squircle>
      </button>
    </div>
  );
}
