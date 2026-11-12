"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreviewReducedMotion } from "@/lib/preview-reduced-motion";

type PreviewStageProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function PreviewStage({ children, className, style }: PreviewStageProps) {
  const pathname = usePathname();
  const reduce = usePreviewReducedMotion();

  return (
    <div
      key={`${pathname}:${reduce}`}
      data-preview-stage=""
      className={cn(className, reduce && "preview-reduced-motion")}
      style={style}
    >
      <MotionConfig reducedMotion={reduce ? "always" : "user"}>{children}</MotionConfig>
    </div>
  );
}
