"use client";

import type { ComponentProps } from "react";
import { useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type RadialProgressProps = Omit<ComponentProps<"div">, "children"> & {
  value: number;
  max?: number;
  label: string;
  caption?: string;
  format?: Format;
  color?: string;
  thickness?: number;
};

export function RadialProgress({
  value,
  max = 100,
  label,
  caption,
  format,
  color = "var(--brand)",
  thickness = 10,
  className,
  ...props
}: RadialProgressProps) {
  const progress = useDrawIn();
  const ratio = Math.min(Math.max(value / (max || 1), 0), 1);
  const text = format ? format(value) : `${Math.round(ratio * 100)}%`;
  const r = 50 - thickness / 2;

  return (
    <div
      data-slot="radial-progress"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={text}
      className={cn("relative aspect-square w-full max-w-44", className)}
      {...props}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="size-full -rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-foreground/[0.07]" />
        {ratio > 0 && (
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${ratio * progress} 1`}
          />
        )}
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-2xl font-medium tabular-nums">
          {format ? text : `${Math.round(ratio * progress * 100)}%`}
        </span>
        {caption && <span className="max-w-[70%] text-xs font-semibold text-muted-foreground">{caption}</span>}
      </div>
    </div>
  );
}
