"use client";

import type { ComponentProps } from "react";
import { formatCompact } from "@/lib/chart";
import { ChartTable, chartFocus, useChartNav, useDrawIn, type ChartDatum, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type RadialBarChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  index: string;
  value: string;
  label: string;
  format?: Format;
  color?: string;
  totalLabel?: string;
};

const C = 100;
const INNER = 46;
const OUTER = 96;
// server and browser can differ in the last digit of sin and cos, which breaks hydration
const round = (n: number) => Math.round(n * 100) / 100;

export function RadialBarChart({
  data,
  index,
  value: key,
  label,
  format = formatCompact,
  color = "var(--brand)",
  totalLabel = "Total",
  className,
  ...props
}: RadialBarChartProps) {
  const { active, setActive, handlers } = useChartNav(data.length);
  const progress = useDrawIn();
  const values = data.map((d) => Math.max(Number(d[key]) || 0, 0));
  const top = Math.max(...values, 0) || 1;
  const total = values.reduce((a, v) => a + v, 0);
  const step = (Math.PI * 2) / Math.max(data.length, 1);
  const width = Math.min(Math.max(((INNER * step) * 0.55), 2), 9);
  const current = active === null ? null : data[active];

  return (
    <figure data-slot="radial-bar-chart" className={cn("flex w-full justify-center", className)} {...props}>
      <div
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each bar.`}
        className={cn("relative aspect-square w-full max-w-72 rounded-full", chartFocus)}
        {...handlers}
      >
        <svg viewBox="0 0 200 200" aria-hidden className="size-full overflow-visible">
          {values.map((v, i) => {
            const angle = i * step;
            const grow = Math.min(Math.max(progress * 1.5 - (i / data.length) * 0.5, 0), 1);
            const r = INNER + width / 2 + (OUTER - INNER - width) * (v / top) * grow;
            const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
            return (
              <g key={i} onPointerEnter={() => setActive(i)}>
                <line
                  x1={round(C + (INNER + width / 2) * sin)}
                  y1={round(C - (INNER + width / 2) * cos)}
                  x2={round(C + (OUTER - width / 2) * sin)}
                  y2={round(C - (OUTER - width / 2) * cos)}
                  stroke="currentColor"
                  strokeWidth={width}
                  strokeLinecap="round"
                  className="text-foreground/[0.06]"
                />
                <line
                  x1={round(C + (INNER + width / 2) * sin)}
                  y1={round(C - (INNER + width / 2) * cos)}
                  x2={round(C + r * sin)}
                  y2={round(C - r * cos)}
                  stroke={color}
                  strokeWidth={width}
                  strokeLinecap="round"
                  opacity={active === null ? 0.35 + 0.65 * (v / top) : active === i ? 1 : 0.2}
                  className="transition-opacity duration-200 motion-reduce:transition-none"
                />
              </g>
            );
          })}
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-muted-foreground">{current ? String(current[index]) : totalLabel}</span>
          <span className="font-mono text-2xl font-medium tabular-nums">{format(current ? values[active!] : total * progress)}</span>
        </div>
        <p aria-live="polite" className="sr-only">
          {current ? `${current[index]}: ${format(values[active!])}` : ""}
        </p>
      </div>
      <ChartTable caption={label} columns={[index, key]} rows={data.map((d, i) => [String(d[index]), format(values[i])])} />
    </figure>
  );
}
