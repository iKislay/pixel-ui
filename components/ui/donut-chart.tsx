"use client";

import type { ComponentProps } from "react";
import { arcLine, formatCompact, seriesColor } from "@/lib/chart";
import { ChartTable, chartFocus, useChartNav, useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type DonutSlice = { label: string; value: number; color?: string };

export type DonutChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: DonutSlice[];
  label: string;
  format?: Format;
  thickness?: number;
  totalLabel?: string;
};

const SIZE = 200;
// space between the round ends of neighbouring slices, in chart units
const GAP = 3;

export function DonutChart({
  data,
  label,
  format = formatCompact,
  thickness = 24,
  totalLabel = "Total",
  className,
  ...props
}: DonutChartProps) {
  const { active, setActive, handlers } = useChartNav(data.length);
  const progress = useDrawIn();
  const total = data.reduce((sum, d) => sum + Math.max(d.value, 0), 0) || 1;
  const r = SIZE / 2 - 8 - thickness / 2;
  // a round cap reaches past its arc by half the stroke, so each slice gives that back
  const trim = (thickness / 2 + GAP / 2) / r;
  const share = (value: number) => `${Math.round((Math.max(value, 0) / total) * 100)}%`;

  const turn = (value: number) => (Math.max(value, 0) / total) * Math.PI * 2 * progress;
  const slices = data.map((d, i) => {
    const start = data.slice(0, i).reduce((sum, prev) => sum + turn(prev.value), 0);
    return { ...d, color: seriesColor(i, d.color), start, end: start + turn(d.value) };
  });

  const current = active === null ? null : slices[active];

  return (
    <figure data-slot="donut-chart" className={cn("flex flex-wrap items-center justify-center gap-x-10 gap-y-6", className)} {...props}>
      <div
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each slice.`}
        className={cn("relative aspect-square w-full max-w-[220px] rounded-full", chartFocus)}
        {...handlers}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className="size-full overflow-visible">
          {slices.map((slice, i) => {
            if (slice.end <= slice.start) return null;
            const lifted = active === i;
            const whole = slices.filter((s) => s.end > s.start).length === 1;
            const start = whole ? slice.start : slice.start + trim;
            // a slice too thin for two caps shrinks to a dot at its middle
            const end = whole ? slice.end : Math.max(slice.end - trim, start + 1e-3);
            const middle = (slice.start + slice.end) / 2;
            return (
              <path
                key={slice.label}
                d={end - start < 2e-3 ? arcLine(SIZE / 2, SIZE / 2, r, middle, middle + 1e-3) : arcLine(SIZE / 2, SIZE / 2, r, start, end)}
                fill="none"
                stroke={slice.color}
                strokeWidth={thickness + (lifted ? 6 : 0)}
                strokeLinecap="round"
                opacity={active === null || lifted ? 1 : 0.35}
                onPointerEnter={() => setActive(i)}
                className="transition-[opacity,stroke-width] duration-200 motion-reduce:transition-none"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-2xl font-medium tabular-nums">{format(current ? current.value : total)}</span>
          <span className="max-w-[60%] truncate text-xs font-semibold text-muted-foreground">
            {current ? `${current.label} · ${share(current.value)}` : totalLabel}
          </span>
        </div>
        <p aria-live="polite" className="sr-only">
          {current ? `${current.label}: ${format(current.value)}, ${share(current.value)}` : ""}
        </p>
      </div>
      <ul aria-hidden className="flex min-w-40 flex-col gap-2 text-sm">
        {slices.map((slice, i) => (
          <li
            key={slice.label}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            className={cn(
              "flex items-center gap-2.5 transition-opacity duration-200 motion-reduce:transition-none",
              active !== null && active !== i && "opacity-40",
            )}
          >
            <span className="size-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="font-semibold text-muted-foreground">{slice.label}</span>
            <span className="ml-auto pl-4 font-mono font-medium tabular-nums">{share(slice.value)}</span>
          </li>
        ))}
      </ul>
      <ChartTable
        caption={label}
        columns={["Slice", "Value", "Share"]}
        rows={data.map((d) => [d.label, format(d.value), share(d.value)])}
      />
    </figure>
  );
}
