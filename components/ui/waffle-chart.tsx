"use client";

import { useState, type ComponentProps } from "react";
import { allocate, formatCompact, seriesColor } from "@/lib/chart";
import { useDrawIn, type Format, EffectDefs, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type WaffleDatum = { label: string; value: number; color?: string };

export type WaffleChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: WaffleDatum[];
  label: string;
  total?: number;
  columns?: number;
  rows?: number;
  format?: Format;
  effect?: ChartEffect;
};

export function WaffleChart({
  data,
  label,
  total,
  columns = 10,
  rows = 10,
  format = formatCompact,
  effect,
  className,
  ...props
}: WaffleChartProps) {
  const progress = useDrawIn();
  const [active, setActive] = useState<number | null>(null);
  const cells = columns * rows;
  const sum = data.reduce((a, d) => a + Math.max(d.value, 0), 0);
  const whole = Math.max(total ?? sum, sum) || 1;
  // a total above the sum leaves the remaining cells empty
  const counts = allocate([...data.map((d) => d.value), whole - sum], cells);
  const owners = counts.flatMap((count, i) => Array<number>(count).fill(i));

  return (
    <figure data-slot="waffle-chart" className={cn("flex flex-wrap items-center justify-center gap-x-10 gap-y-6", className)} {...props}>
      <figcaption className="sr-only">{label}</figcaption>
      <EffectDefs effect={effect} />
      <div
        aria-hidden
        className="grid w-full max-w-52 gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, filter: effect?.filter }}
        onPointerLeave={() => setActive(null)}
      >
        {owners.map((owner, k) => {
          const filled = owner < data.length && k < cells * progress;
          return (
            <div
              key={k}
              onPointerEnter={() => filled && setActive(owner)}
              className={cn(
                "aspect-square rounded-[30%] transition-opacity duration-200 [corner-shape:squircle] motion-reduce:transition-none",
                !filled && "bg-foreground/[0.07]",
                filled && active !== null && active !== owner && "opacity-30",
              )}
              style={filled ? { background: seriesColor(owner, data[owner].color) } : undefined}
            />
          );
        })}
      </div>
      <ul className="flex min-w-40 flex-col gap-2 text-sm" onPointerLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <li
            key={d.label}
            onPointerEnter={() => setActive(i)}
            className={cn(
              "flex items-center gap-2.5 transition-opacity duration-200 motion-reduce:transition-none",
              active !== null && active !== i && "opacity-35",
            )}
          >
            <span aria-hidden className="size-2.5 rounded-[30%]" style={{ background: seriesColor(i, d.color) }} />
            <span className="font-semibold text-muted-foreground">{d.label}</span>
            <span className="ml-auto pl-4 font-mono font-medium tabular-nums">{format(d.value)}</span>
            <span className="w-9 text-right font-mono text-xs text-muted-foreground tabular-nums">
              {Math.round((Math.max(d.value, 0) / whole) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
