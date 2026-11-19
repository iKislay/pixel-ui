"use client";

import { PosterSphere, type PosterSphereProps } from "@/components/ui/poster-sphere";
import { usePreviewControl } from "@/components/preview/PreviewControls";

export default function Demo() {
  const [size] = usePreviewControl("size", "md");
  const [smoothness] = usePreviewControl("smoothness", "smooth");
  const [movement] = usePreviewControl("movement", "drag");

  return (
    <div className="relative flex h-full min-h-[600px] flex-col items-center justify-center gap-3 px-4 sm:px-6">
      <PosterSphere
        size={size as PosterSphereProps["size"]}
        smoothness={smoothness as PosterSphereProps["smoothness"]}
        movement={movement as PosterSphereProps["movement"]}
        className="h-[min(78vh,640px)] min-h-[480px] w-full max-w-5xl rounded-2xl border"
      />
      <span className="text-center text-xs text-muted-foreground select-none">
        {movement === "hover" ? "Move toward an edge or drag to browse" : "Drag to browse"}, click a poster to open it
      </span>
    </div>
  );
}
