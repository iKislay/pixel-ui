"use client";

import { useState, type ComponentProps } from "react";
import { formatCompact, seriesColor } from "@/lib/chart";
import { useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type SegmentedBarDatum = { label: string; value: number; color?: string };

export type SegmentedBarProps = Omit<ComponentProps<"figure">, "children"> & {
  data: SegmentedBarDatum[];
  label: string;
  format?: Format;
};

export function SegmentedBar({ data, label, format = formatCompact, className, ...props }: SegmentedBarProps) {
  const progress = useDrawIn();
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + Math.max(d.value, 0), 0) || 1;
  const segments = data.map((d, i) => ({ ...d, color: seriesColor(i, d.color), share: Math.max(d.value, 0) / total }));
  const dim = (i: number) => active !== null && active !== i && "opacity-35";

  return (
    <figure data-slot="segmented-bar" className={cn("flex w-full flex-col gap-4", className)} onPointerLeave={() => setActive(null)} {...props}>
      <figcaption className="sr-only">{label}</figcaption>
      <div aria-hidden className="flex h-3.5 gap-1" style={{ width: `${progress * 100}%` }}>
        {segments.map((segment, i) =>
          segment.share > 0 ? (
            <div
              key={segment.label}
              onPointerEnter={() => setActive(i)}
              className={cn("min-w-1 rounded-full transition-opacity duration-200 motion-reduce:transition-none", dim(i))}
              style={{ flexGrow: segment.share, flexBasis: 0, background: segment.color }}
            />
          ) : null,
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {segments.map((segment, i) => (
          <li
            key={segment.label}
            onPointerEnter={() => setActive(i)}
            className={cn("flex items-center gap-2 transition-opacity duration-200 motion-reduce:transition-none", dim(i))}
          >
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: segment.color }} />
            <span className="truncate font-semibold text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">{format(segment.value)}</span>
            <span className="w-9 text-right font-mono text-xs text-muted-foreground tabular-nums">{Math.round(segment.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
