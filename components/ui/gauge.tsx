"use client";

import type { ComponentProps } from "react";
import { formatCompact } from "@/lib/chart";
import { useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type GaugeProps = Omit<ComponentProps<"div">, "children"> & {
  value: number;
  min?: number;
  max?: number;
  label: string;
  caption?: string;
  format?: Format;
  color?: string;
  ticks?: number;
};

// server and browser can differ in the last digit of sin and cos, which breaks hydration
const round = (n: number) => Math.round(n * 100) / 100;

export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  caption,
  format = formatCompact,
  color = "var(--brand)",
  ticks = 41,
  className,
  ...props
}: GaugeProps) {
  const progress = useDrawIn();
  const ratio = Math.min(Math.max((value - min) / (max - min || 1), 0), 1);
  const lit = ratio * progress * (ticks - 1);

  return (
    <div
      data-slot="gauge"
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      className={cn("w-full max-w-64", className)}
      {...props}
    >
      <div className="relative">
        <svg
          viewBox="0 0 200 112"
          aria-hidden
          className="w-full overflow-visible"
        >
          {Array.from({ length: ticks }, (_, i) => {
            const angle = -Math.PI / 2 + (Math.PI * i) / (ticks - 1);
            const on = i <= lit + 1e-6;
            return (
              <line
                key={i}
                x1={round(100 + 72 * Math.sin(angle))}
                y1={round(100 - 72 * Math.cos(angle))}
                x2={round(100 + 92 * Math.sin(angle))}
                y2={round(100 - 92 * Math.cos(angle))}
                stroke={on ? color : "currentColor"}
                strokeWidth={4}
                strokeLinecap="round"
                className={on ? undefined : "text-foreground/[0.09]"}
              />
            );
          })}
        </svg>
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex flex-col items-center"
        >
          <span className="font-mono text-3xl font-medium tabular-nums">
            {format(min + (value - min) * progress)}
          </span>
          {caption && (
            <span className="text-xs font-semibold text-muted-foreground">
              {caption}
            </span>
          )}
        </div>
      </div>
      <div
        aria-hidden
        className="mt-1 flex justify-between px-1 font-mono text-[10px] text-muted-foreground tabular-nums"
      >
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
