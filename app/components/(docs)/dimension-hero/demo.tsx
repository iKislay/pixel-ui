"use client";

import { DimensionHero } from "@/components/ui/dimension-hero";

export default function Demo() {
  return (
    <div className="relative flex h-full min-h-[600px] flex-col items-center justify-center gap-3 px-4 sm:px-6">
      <DimensionHero className="h-[min(78vh,640px)] min-h-[480px] w-full max-w-5xl rounded-2xl border" />
      <span className="text-center text-xs text-muted-foreground select-none">
        Press the pill, then move the pointer and scroll
      </span>
    </div>
  );
}
