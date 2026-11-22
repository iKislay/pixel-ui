"use client";

import { useState, type ComponentProps } from "react";
import { seriesColor } from "@/lib/chart";
import { useDrawIn, type Format, EffectLayer, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type ActivityRing = { label: string; value: number; max?: number; color?: string };

export type ActivityRingsProps = Omit<ComponentProps<"figure">, "children"> & {
  data: ActivityRing[];
  label: string;
  format?: Format;
  thickness?: number;
  effect?: ChartEffect;
};

export function ActivityRings({
  data,
  label,
  format = (n) => String(Math.round(n)),
  thickness = 14,
  effect,
  className,
  ...props
}: ActivityRingsProps) {
  const progress = useDrawIn();
  const [active, setActive] = useState<number | null>(null);
  const rings = data.map((d, i) => ({
    ...d,
    color: seriesColor(i, d.color),
    ratio: Math.min(Math.max(d.value / (d.max ?? 100), 0), 1),
    r: 100 - thickness / 2 - i * (thickness + 4),
  }));

  return (
    <figure data-slot="activity-rings" className={cn("flex flex-wrap items-center justify-center gap-x-10 gap-y-6", className)} {...props}>
      <figcaption className="sr-only">{label}</figcaption>
      <svg viewBox="0 0 200 200" aria-hidden className="w-full max-w-48 -rotate-90 overflow-visible">
        <EffectLayer effect={effect}>
          {rings.map((ring, i) => (
            <g key={ring.label} opacity={active === null || active === i ? 1 : 0.35} className="transition-opacity duration-200 motion-reduce:transition-none">
              <circle cx={100} cy={100} r={ring.r} fill="none" stroke={ring.color} strokeOpacity={0.14} strokeWidth={thickness} />
              {ring.ratio > 0 && (
                <circle
                  cx={100}
                  cy={100}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={thickness}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={`${ring.ratio * Math.min(Math.max(progress * 1.3 - i * 0.15, 0), 1)} 1`}
                />
              )}
            </g>
          ))}
        </EffectLayer>
      </svg>
      <ul className="flex min-w-40 flex-col gap-3 text-sm" onPointerLeave={() => setActive(null)}>
        {rings.map((ring, i) => (
          <li key={ring.label} onPointerEnter={() => setActive(i)} className="flex items-center gap-2.5">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: ring.color }} />
            <span className="font-semibold text-muted-foreground">{ring.label}</span>
            <span className="ml-auto pl-4 font-mono font-medium tabular-nums">
              {format(ring.value)}
              <span className="text-muted-foreground">/{format(ring.max ?? 100)}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
