"use client";

import { barPath } from "@/lib/chart";
import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type StackedBarChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend"> & {
  radius?: number;
};

export function StackedBarChart({ radius = 6, ...props }: StackedBarChartProps) {
  return (
    <CartesianChart
      slot="stacked-bar-chart"
      bars
      stacked
      {...props}
      overlay={({ x, band, top, floor, active }) =>
        active !== null && (
          <rect x={x(active) - band / 2 + 2} y={top} width={band - 4} height={floor - top} rx={10} className="pointer-events-none fill-foreground/[0.04]" />
        )
      }
    >
      {({ data, series, x, band, y, active, progress }) => {
        const width = Math.min(band * 0.56, 44);
        return (
          <>
            {data.map((d, i) => {
              const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
              const values = series.map((s) => Math.max(Number(d[s.key]) || 0, 0));
              const last = values.findLastIndex((v) => v > 0);
              let sum = 0;
              return series.map((s, j) => {
                const start = y(sum * grow);
                sum += values[j];
                // a 2px gap separates segments; only the top one is rounded
                const end = Math.min(y(sum * grow) + (j === last ? 0 : 2), start);
                return (
                  <path
                    key={`${i}-${s.key}`}
                    d={barPath(x(i) - width / 2, start, width, end, j === last ? radius : 0)}
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
