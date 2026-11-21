"use client";

import { useId } from "react";
import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";
import { formatCompact } from "@/lib/chart";

export type PillBarChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "grid"> & {
  highlight?: number;
};

export function PillBarChart({ highlight, format = formatCompact, ...props }: PillBarChartProps) {
  const id = useId().replace(/[^\w-]/g, "");

  return (
    <CartesianChart slot="pill-bar-chart" bars grid={false} format={format} {...props}>
      {({ data, series, x, band, y, floor, active, progress }) => {
        const lit = active ?? highlight ?? data.length - 1;
        const width = Math.min((band * 0.62 - 4 * (series.length - 1)) / series.length, 40);
        const group = width * series.length + 4 * (series.length - 1);
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
            {data.map((d, i) => {
              const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
              return series.map((s, j) => {
                const height = (floor - y(Math.max(Number(d[s.key]) || 0, 0))) * grow;
                return (
                  <rect
                    key={`${i}-${s.key}`}
                    x={x(i) - group / 2 + j * (width + 4)}
                    y={floor - height}
                    width={width}
                    height={height}
                    rx={Math.min(width / 2, height / 2)}
                    fill={i === lit ? s.color : `url(#${id}-${j})`}
                  />
                );
              });
            })}
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
    </CartesianChart>
  );
}
