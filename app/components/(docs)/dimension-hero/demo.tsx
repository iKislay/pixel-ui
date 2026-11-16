"use client";

import { DimensionHero } from "@/components/ui/dimension-hero";
import { usePreviewControl } from "@/components/preview/PreviewControls";
import { DIMENSION_HEADLINE, DIMENSION_TAGLINE } from "@/components/Description/SidebarControls";

export default function Demo() {
  const [headline] = usePreviewControl("headline", DIMENSION_HEADLINE);
  const [tagline] = usePreviewControl("tagline", DIMENSION_TAGLINE);
  const [replay] = usePreviewControl("replay", "0");

  return (
    <div className="relative flex h-full min-h-[600px] flex-col items-center justify-center gap-3 px-4 sm:px-6">
      <DimensionHero
        key={replay}
        headline={headline}
        tagline={tagline}
        className="h-[min(78vh,640px)] min-h-[480px] w-full max-w-5xl rounded-2xl border"
      />
      <span className="text-center text-xs text-muted-foreground select-none">
        Press the pill, then move the pointer and scroll
      </span>
    </div>
  );
}
