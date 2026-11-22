"use client";

import { useId } from "react";
import { CartesianChart, type CartesianChartProps, type CartesianContext } from "@/components/ui/chart";
import { formatCompact } from "@/lib/chart";

export type PillBarChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend" | "grid"> & {
  highlight?: number;
};

const size = (band: number, count: number) => {
  const width = Math.min((band * 0.62 - 4 * (count - 1)) / count, 40);
  return { width, group: width * count + 4 * (count - 1) };
};

// every pill's place, rising one column after another
const pills = (
  data: CartesianContext["data"],
  series: CartesianContext["series"],
  x: (i: number) => number,
  y: (v: number) => number,
  floor: number,
  progress: number,
  width: number,
  group: number,
) =>
  data.flatMap((d, i) => {
    const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
    return series.map((s, j) => {
      const h = (floor - y(Math.max(Number(d[s.key]) || 0, 0))) * grow;
      return { key: `${i}-${s.key}`, i, j, color: s.color, x: x(i) - group / 2 + j * (width + 4), y: floor - h, h };
    });
  });

export function PillBarChart({ highlight, format = formatCompact, ...props }: PillBarChartProps) {
  const id = useId().replace(/[^\w-]/g, "");

  return (
    <CartesianChart
      slot="pill-bar-chart"
      bars
      grid={false}
      format={format}
      {...props}
      overlay={({ data, series, x, band, y, floor, active, progress }) => {
        const lit = active ?? highlight ?? data.length - 1;
        const { width, group } = size(band, series.length);
        const first = Number(data[lit]?.[series[0].key]) || 0;
        const tag = format(first);
        const tagWidth = tag.length * 7 + 16;
        return (
          <>
            <defs>
              {series.map((s, j) => (
                <pattern key={s.key} id={`${id}-${j}`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width={6} height={6} fill={s.color} fillOpacity={0.1} />
                  <line x1={0} y1={0} x2={0} y2={6} stroke={s.color} strokeOpacity={0.4} strokeWidth={2} />
                </pattern>
              ))}
            </defs>
            {/* the hatched bars are the quiet ones, so they stay out of any effect */}
            {pills(data, series, x, y, floor, progress, width, group).map((p) =>
              p.i === lit ? null : <rect key={p.key} x={p.x} y={p.y} width={width} height={p.h} rx={Math.min(width / 2, p.h / 2)} fill={`url(#${id}-${p.j})`} />,
            )}
            {active === null && progress === 1 && data[lit] && (
              <g transform={`translate(${x(lit) - group / 2 + width / 2}, ${y(first) - 14})`}>
                <rect x={-tagWidth / 2} y={-11} width={tagWidth} height={22} rx={11} className="fill-foreground" />
                <text textAnchor="middle" dy="0.35em" className="fill-background font-mono text-[11px] font-medium tabular-nums">
                  {tag}
                </text>
              </g>
            )}
          </>
        );
      }}
    >
      {({ data, series, x, band, y, floor, active, progress }) => {
        const lit = active ?? highlight ?? data.length - 1;
        const { width, group } = size(band, series.length);
        return pills(data, series, x, y, floor, progress, width, group).map((p) =>
          p.i === lit ? <rect key={p.key} x={p.x} y={p.y} width={width} height={p.h} rx={Math.min(width / 2, p.h / 2)} fill={p.color} /> : null,
        );
      }}
    </CartesianChart>
  );
}
