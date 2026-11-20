"use client";

import { barPath } from "@/lib/chart";
import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type BarChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero"> & {
  radius?: number;
};

export function BarChart({ radius = 6, ...props }: BarChartProps) {
  return (
    <CartesianChart slot="bar-chart" bars {...props}>
      {({ data, series, x, band, y, top, floor, active, progress }) => {
        const base = y(0);
        const group = Math.min(band * 0.64, 28 * series.length + 2 * (series.length - 1));
        const width = (group - 2 * (series.length - 1)) / series.length;
        return (
          <>
            {active !== null && (
              <rect
                x={x(active) - band / 2 + 2}
                y={top}
                width={band - 4}
                height={floor - top}
                rx={10}
                className="fill-foreground/[0.04]"
              />
            )}
            {data.map((d, i) => {
              // each bar rises a beat after the one before it
              const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
              return series.map((s, j) => {
                const left = x(i) - group / 2 + j * (width + 2);
                const end = base + (y(Number(d[s.key]) || 0) - base) * grow;
                return (
                  <path
                    key={`${i}-${s.key}`}
                    d={barPath(left, base, width, end, radius)}
                    fill={s.color}
                    opacity={active === null || active === i ? 1 : 0.45}
                    className="transition-opacity duration-200 motion-reduce:transition-none"
                  />
                );
              });
            })}
          </>
        );
      }}
    </CartesianChart>
  );
}
