"use client";

import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type DotMatrixChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "grid"> & {
  rows?: number;
};

export function DotMatrixChart({ rows = 12, ...props }: DotMatrixChartProps) {
  return (
    <CartesianChart slot="dot-matrix-chart" bars stacked grid={false} {...props}>
      {({ data, series, x, band, y, top, floor, active, progress }) => {
        const pitch = (floor - top) / rows;
        const r = Math.max(Math.min(band * 0.32, pitch * 0.4), 1.5);
        // every dot stands for the same amount, so a column's lit dots read as its total
        const unit = pitch / (y(0) - y(1));
        return data.map((d, i) => {
          const grow = Math.min(Math.max(progress * 1.5 - (i / data.length) * 0.5, 0), 1);
          const bounds = series.reduce<number[]>((acc, s) => [...acc, (acc.at(-1) ?? 0) + Math.max(Number(d[s.key]) || 0, 0)], []);
          return Array.from({ length: rows }, (_, k) => {
            const level = (k + 0.5) * unit;
            const owner = bounds.findIndex((b) => level <= b);
            const lit = owner !== -1 && k < rows * grow;
            return (
              <circle
                key={`${i}-${k}`}
                cx={x(i)}
                cy={floor - pitch * (k + 0.5)}
                r={r}
                fill={lit ? series[owner].color : "currentColor"}
                className={lit ? undefined : "text-foreground/[0.07]"}
                opacity={lit && active !== null && active !== i ? 0.4 : 1}
              />
            );
          });
        });
      }}
    </CartesianChart>
  );
}
