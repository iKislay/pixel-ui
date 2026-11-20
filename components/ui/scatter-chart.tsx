"use client";

import type { ComponentProps } from "react";
import { formatCompact, niceTicks, scaleLinear, seriesColor } from "@/lib/chart";
import {
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFocus,
  useChartNav,
  useChartWidth,
  useDrawIn,
  type Format,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type ScatterPoint = { x: number; y: number; label?: string };

export type ScatterSeries = { label: string; color?: string; points: ScatterPoint[] };

export type ScatterChartProps = Omit<ComponentProps<"figure">, "children"> & {
  series: ScatterSeries[];
  label: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  format?: Format;
  formatX?: Format;
};

const MARGIN = { top: 12, right: 12, bottom: 40, left: 44 };

export function ScatterChart({
  series,
  label,
  xLabel = "x",
  yLabel = "y",
  height = 280,
  format = formatCompact,
  formatX = formatCompact,
  className,
  ...props
}: ScatterChartProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const points = series
    .flatMap((s, i) => s.points.map((p) => ({ ...p, series: s.label, color: seriesColor(i, s.color) })))
    .sort((a, b) => a.x - b.x);
  const { active, setActive, handlers } = useChartNav(points.length);

  const xTicks = niceTicks(Math.min(...points.map((p) => p.x)), Math.max(...points.map((p) => p.x)), 5);
  const yTicks = niceTicks(Math.min(...points.map((p) => p.y)), Math.max(...points.map((p) => p.y)), 4);
  const x = scaleLinear([xTicks[0], xTicks.at(-1)!], [MARGIN.left, Math.max(width - MARGIN.right, MARGIN.left)]);
  const y = scaleLinear([yTicks[0], yTicks.at(-1)!], [height - MARGIN.bottom, MARGIN.top]);

  const pick = (clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    let best: number | null = null;
    let distance = 32 ** 2;
    points.forEach((p, i) => {
      const d = (x(p.x) - (clientX - box.left)) ** 2 + (y(p.y) - (clientY - box.top)) ** 2;
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    setActive(best);
  };

  const point = active === null ? null : points[active];

  return (
    <figure data-slot="scatter-chart" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      {series.length > 1 && <ChartLegend items={series.map((s, i) => ({ label: s.label, color: seriesColor(i, s.color) }))} />}
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each point.`}
        className={cn("relative w-full touch-pan-y", chartFocus)}
        style={{ height }}
        onPointerMove={(event) => pick(event.clientX, event.clientY)}
        onPointerDown={(event) => pick(event.clientX, event.clientY)}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            {yTicks.map((tick) => (
              <g key={`y${tick}`}>
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="currentColor" className="text-foreground/[0.06]" />
                <text x={MARGIN.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px] tabular-nums">
                  {format(tick)}
                </text>
              </g>
            ))}
            {xTicks.map((tick) => (
              <text key={`x${tick}`} x={x(tick)} y={height - MARGIN.bottom + 18} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px] tabular-nums">
                {formatX(tick)}
              </text>
            ))}
            <text x={width - MARGIN.right} y={height - 4} textAnchor="end" className="fill-muted-foreground text-[11px] font-semibold">
              {xLabel} →
            </text>
            {points.map((p, i) => {
              // dots pop in from left to right
              const grow = Math.min(Math.max(progress * 1.5 - (i / points.length) * 0.5, 0), 1);
              return (
                <circle
                  key={i}
                  cx={x(p.x)}
                  cy={y(p.y)}
                  r={(active === i ? 7 : 5) * grow}
                  fill={p.color}
                  fillOpacity={active === null || active === i ? 0.9 : 0.35}
                  stroke="var(--background)"
                  strokeWidth={2}
                  className="transition-[fill-opacity] duration-200 motion-reduce:transition-none"
                />
              );
            })}
          </svg>
        )}
        <ChartTooltip
          x={point ? x(point.x) : 0}
          y={point ? y(point.y) : 0}
          width={width}
          title={point ? point.label ?? point.series : undefined}
          rows={point ? [{ label: xLabel, value: formatX(point.x) }, { label: yLabel, value: format(point.y), color: point.color }] : null}
        />
        <p aria-live="polite" className="sr-only">
          {point ? `${point.label ?? point.series}: ${xLabel} ${formatX(point.x)}, ${yLabel} ${format(point.y)}` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={["Point", "Series", xLabel, yLabel]}
        rows={points.map((p, i) => [p.label ?? String(i + 1), p.series, formatX(p.x), format(p.y)])}
      />
    </figure>
  );
}
