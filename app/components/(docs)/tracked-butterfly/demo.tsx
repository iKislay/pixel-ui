"use client";

import { TrackedButterfly } from "@/components/ui/tracked-butterfly";

export default function TrackedButterflyDemo() {
  return (
    <div className="relative flex h-full min-h-[600px] flex-col items-center justify-center gap-3 px-6">
      <TrackedButterfly className="h-[540px] w-full max-w-3xl rounded-2xl border" />
      <span className="text-xs text-muted-foreground select-none">
        Move to aim the target, click to send a ring across the wings
      </span>
    </div>
  );
}
