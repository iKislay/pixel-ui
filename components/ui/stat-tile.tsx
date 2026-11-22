"use client";

import { useId, type ComponentProps } from "react";
import { formatCompact, scaleLinear, smoothPath, type Point } from "@/lib/chart";
import { useDrawIn, type Format, EffectLayer, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type StatTileProps = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  value: number;
  change?: number;
  caption?: string;
  trend?: number[];
  format?: Format;
  invert?: boolean;
  color?: string;
  effect?: ChartEffect;
};

function Trend({ data, color, effect }: { data: number[]; color: string; effect?: ChartEffect }) {
  const id = useId().replace(/[^\w-]/g, "");
  const progress = useDrawIn(0.15);
  const x = scaleLinear([0, data.length - 1], [2, 118]);
  const y = scaleLinear([Math.min(...data), Math.max(...data)], [38, 4]);
  const points = data.map((v, i): Point => [x(i), y(v)]);
  const line = smoothPath(points);

  return (
    <svg viewBox="0 0 120 40" aria-hidden className="h-10 w-28 shrink-0 overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <EffectLayer effect={effect}>
        <path d={`${line}L118,40L2,40Z`} fill={`url(#${id})`} opacity={progress} />
      </EffectLayer>
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  change,
  caption,
  trend,
  format = formatCompact,
  invert = false,
  color = "var(--brand)",
  effect,
  className,
  ...props
}: StatTileProps) {
  const progress = useDrawIn();
  const up = (change ?? 0) >= 0;
  const good = up !== invert;
  const changeText = change === undefined ? "" : `${up ? "+" : "−"}${Math.abs(change).toFixed(1)}%`;

  return (
    <div
      data-slot="stat-tile"
      role="group"
      aria-label={`${label}: ${format(value)}${change === undefined ? "" : `, ${up ? "up" : "down"} ${Math.abs(change).toFixed(1)}%`}${caption ? ` ${caption}` : ""}`}
      className={cn("flex flex-col gap-3 rounded-[28px] bg-card p-6 [corner-shape:squircle]", className)}
      {...props}
    >
      <p aria-hidden className="text-sm font-semibold text-muted-foreground">
        {label}
      </p>
      <div aria-hidden className="flex items-end justify-between gap-4">
        <p className="font-mono text-3xl font-medium tracking-tight tabular-nums">{format(value * progress)}</p>
        {trend && trend.length > 1 && <Trend data={trend} color={color} effect={effect} />}
      </div>
      {(change !== undefined || caption) && (
        <p aria-hidden className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono tabular-nums",
                good ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" : "bg-red-500/12 text-red-700 dark:text-red-400",
              )}
            >
              <svg viewBox="0 0 12 12" className={cn("size-3", !up && "rotate-180")} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" />
              </svg>
              {changeText}
            </span>
          )}
          {caption}
        </p>
      )}
    </div>
  );
}
