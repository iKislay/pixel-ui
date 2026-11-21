"use client";

import type { ComponentProps } from "react";
import { formatCompact, linePath, niceTicks, seriesColor, type Point } from "@/lib/chart";
import {
  ChartLegend,
  ChartTable,
  chartFocus,
  useChartNav,
  useDrawIn,
  type ChartDatum,
  type ChartSeries,
  type Format,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type RadarChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  index: string;
  series: ChartSeries[];
  label: string;
  format?: Format;
};

const C = 150;
const R = 104;

export function RadarChart({ data, index, series: input, label, format = formatCompact, className, ...props }: RadarChartProps) {
  const { active, setActive, handlers } = useChartNav(data.length);
  const progress = useDrawIn();
  const series = input.map((s, i) => ({ ...s, label: s.label ?? s.key, color: seriesColor(i, s.color) }));
  const value = (row: ChartDatum, key: string) => Math.max(Number(row[key]) || 0, 0);
  const ticks = niceTicks(0, Math.max(...data.flatMap((row) => series.map((s) => value(row, s.key)))), 3);
  const top = ticks.at(-1) || 1;
  const angle = (i: number) => (Math.PI * 2 * i) / data.length;
  const at = (i: number, r: number): Point => [C + r * Math.sin(angle(i)), C - r * Math.cos(angle(i))];
  const row = active === null ? null : data[active];

  return (
    <figure data-slot="radar-chart" className={cn("flex w-full flex-col items-center gap-3", className)} {...props}>
      {series.length > 1 && <ChartLegend items={series} />}
      <div
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each axis.`}
        className={cn("relative w-full max-w-80 rounded-full", chartFocus)}
        {...handlers}
      >
        <svg viewBox="0 0 300 300" aria-hidden className="w-full overflow-visible">
          {ticks.slice(1).map((tick) => (
            <circle key={tick} cx={C} cy={C} r={(tick / top) * R} fill="none" stroke="currentColor" className="text-foreground/[0.07]" />
          ))}
          {data.map((d, i) => {
            const [x, y] = at(i, R);
            const [lx, ly] = at(i, R + 22);
            return (
              <g key={i} onPointerEnter={() => setActive(i)}>
                <line x1={C} y1={C} x2={x} y2={y} stroke="currentColor" className={active === i ? "text-foreground/30" : "text-foreground/[0.07]"} />
                <text
                  x={lx}
                  y={ly}
                  dy="0.32em"
                  textAnchor={Math.abs(lx - C) < 8 ? "middle" : lx > C ? "start" : "end"}
                  className={cn("text-[11px] font-medium", active === i ? "fill-foreground" : "fill-muted-foreground")}
                >
                  {String(d[index])}
                </text>
                {/* a wide invisible wedge makes each axis easy to hover */}
                <line x1={C} y1={C} x2={x} y2={y} stroke="transparent" strokeWidth={28} />
              </g>
            );
          })}
          {series.map((s) => {
            const points = data.map((d, i) => at(i, (value(d, s.key) / top) * R * progress));
            return (
              <g key={s.key}>
                <path d={`${linePath(points)}Z`} fill={s.color} fillOpacity={0.14} stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                {active !== null && (
                  <circle cx={points[active][0]} cy={points[active][1]} r={4.5} fill={s.color} stroke="var(--background)" strokeWidth={2} />
                )}
              </g>
            );
          })}
        </svg>
        {row && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-foreground/[0.06] bg-background/90 px-3 py-2 text-xs shadow-lg backdrop-blur-md [corner-shape:squircle]">
            <p className="mb-1 font-semibold text-muted-foreground">{String(row[index])}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto pl-3 font-mono font-medium tabular-nums">{format(value(row, s.key))}</span>
              </p>
            ))}
          </div>
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
