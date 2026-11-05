"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function ThemeToggleDemo() {
  return (
    <div className="relative flex h-full min-h-[500px] items-center justify-center font-runde">
      <div className="flex flex-col items-center gap-3">
        <ThemeToggle className="size-11 [&_svg]:size-5" />
        <span className="text-xs text-muted-foreground select-none">
          Click to toggle theme
        </span>
      </div>
    </div>
  );
}
