"use client";

import { useId, type ComponentProps } from "react";
import { seriesColor } from "@/lib/chart";
import {
  ChartLegend,
  ChartTable,
  EffectLayer,
  chartFocus,
  useChartNav,
  useChartWidth,
  useDrawIn,
  type ChartDatum,
  type ChartEffect,
  type ChartSeries,
  type Format,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type CapsuleStackChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  index: string;
  series: ChartSeries[];
  label: string;
  max?: number;
  height?: number;
  format?: Format;
  effect?: ChartEffect;
};

const TOP = 6;
const BOTTOM = 30;
const GAP = 5;

export function CapsuleStackChart({
  data,
  index,
  series: input,
  label,
  max = 100,
  height = 260,
  format = (n) => `${Math.round(n)}%`,
  effect,
  className,
  ...props
}: CapsuleStackChartProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const { active, setActive, handlers } = useChartNav(data.length);
  const series = input.map((s, i) => ({ ...s, label: s.label ?? s.key, color: seriesColor(i, s.color) }));
  const value = (row: ChartDatum, key: string) => Math.max(Number(row[key]) || 0, 0);
  const plot = height - TOP - BOTTOM;
  const band = width / Math.max(data.length, 1);
  const w = Math.min(band * 0.7, 60);
  const scale = (v: number) => (Math.min(v, max) / (max || 1)) * plot;
  const radius = Math.min(w / 3.2, 18);
  const row = active === null ? null : data[active];

  // every capsule in a column, bottom up, with the hatched remainder above them
  const columns = data.map((d, i) => {
    const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
    const x = band * (i + 0.5) - w / 2;
    const heights = series.map((s) => scale(value(d, s.key)) * grow);
    const below = (j: number) => heights.slice(0, j).reduce((a, h) => a + h, 0);
    const parts = series.map((s, j) => ({ key: s.key, color: s.color, value: value(d, s.key), y: TOP + plot - below(j + 1), h: heights[j] }));
    return { x, parts, rest: plot - below(series.length) };
  });

  return (
    <figure data-slot="capsule-stack-chart" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      {series.length > 1 && <ChartLegend items={series} />}
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each column.`}
        className={cn("relative w-full touch-pan-y", chartFocus)}
        style={{ height }}
        onPointerMove={(event) => {
          const box = ref.current?.getBoundingClientRect();
          if (box) setActive(Math.min(Math.max(Math.floor((event.clientX - box.left) / band), 0), data.length - 1));
        }}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            <defs>
              <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width={8} height={8} className="fill-foreground/[0.03]" />
                <rect width={3} height={8} className="fill-foreground/[0.07]" />
              </pattern>
            </defs>
            {columns.map((c, i) =>
              c.rest > GAP * 2 ? (
                <rect key={i} x={c.x} y={TOP + GAP / 2} width={w} height={c.rest - GAP} rx={Math.min(radius, (c.rest - GAP) / 2)} fill={`url(#${id})`} />
              ) : null,
            )}
            <EffectLayer effect={effect}>
              {columns.map((c, i) =>
                c.parts.map((p, j) =>
                  p.h > GAP + 1 ? (
                    <rect
                      key={`${i}-${p.key}`}
                      x={c.x}
                      y={p.y + GAP / 2}
                      width={w}
                      height={p.h - GAP}
                      rx={Math.min(radius, (p.h - GAP) / 2)}
                      style={{ fill: `color-mix(in oklab, ${effect?.fill?.(p.color, j) ?? p.color} 42%, var(--background))` }}
                    />
                  ) : null,
                ),
              )}
            </EffectLayer>
            {data.map((d, i) => (
              <text
                key={i}
                x={band * (i + 0.5)}
                y={height - 8}
                textAnchor="middle"
                className={cn("text-[11px] font-medium", active === i ? "fill-foreground" : "fill-muted-foreground")}
              >
                {String(d[index])}
              </text>
            ))}
            {active !== null &&
              columns[active].parts.map((p) => {
                if (p.h <= GAP + 1 || progress < 1) return null;
                const text = format(p.value);
                const pill = text.length * 7 + 16;
                return (
                  <g key={p.key} transform={`translate(${columns[active].x + w / 2}, ${p.y + GAP / 2 + 18})`}>
                    <rect x={-pill / 2} y={-11} width={pill} height={22} rx={11} className="fill-foreground" />
                    <text textAnchor="middle" dy="0.35em" className="fill-background font-mono text-[11px] font-medium tabular-nums">
                      {text}
                    </text>
                  </g>
                );
              })}
          </svg>
        )}
        <p aria-live="polite" className="sr-only">
          {row ? `${row[index]}: ${series.map((s) => `${s.label} ${format(value(row, s.key))}`).join(", ")}` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={[index, ...series.map((s) => s.label)]}
        rows={data.map((d) => [String(d[index]), ...series.map((s) => format(value(d, s.key)))])}
      />
    </figure>
  );
}
