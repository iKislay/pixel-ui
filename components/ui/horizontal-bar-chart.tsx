"use client";

import { useState, type ComponentProps } from "react";
import { formatCompact } from "@/lib/chart";
import { useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type HorizontalBarDatum = { label: string; value: number; color?: string };

export type HorizontalBarChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: HorizontalBarDatum[];
  label: string;
  format?: Format;
  max?: number;
  color?: string;
};

export function HorizontalBarChart({
  data,
  label,
  format = formatCompact,
  max,
  color = "var(--brand)",
  className,
  ...props
}: HorizontalBarChartProps) {
  const progress = useDrawIn();
  const [active, setActive] = useState<number | null>(null);
  const top = max ?? Math.max(...data.map((d) => d.value), 0);

  return (
    <figure data-slot="horizontal-bar-chart" className={cn("w-full", className)} {...props}>
      <figcaption className="sr-only">{label}</figcaption>
      <ul className="flex flex-col gap-3.5" onPointerLeave={() => setActive(null)}>
        {data.map((d, i) => {
          const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
          const share = top > 0 ? Math.min(Math.max(d.value, 0) / top, 1) : 0;
          return (
            <li
              key={d.label}
              onPointerEnter={() => setActive(i)}
              className={cn(
                "flex flex-col gap-1.5 transition-opacity duration-200 motion-reduce:transition-none",
                active !== null && active !== i && "opacity-40",
              )}
            >
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="truncate font-semibold text-muted-foreground">{d.label}</span>
                <span className="font-mono font-medium tabular-nums">{format(d.value)}</span>
              </div>
              <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${share * grow * 100}%`, background: d.color ?? color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
