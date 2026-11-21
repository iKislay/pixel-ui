"use client";

import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type RangeChartProps = Omit<
  CartesianChartProps,
  "children" | "slot" | "series" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend"
> & {
  low: string;
  high: string;
  lowLabel?: string;
  highLabel?: string;
  color?: string;
};

export function RangeChart({ low, high, lowLabel = "Low", highLabel = "High", color = "var(--brand)", ...props }: RangeChartProps) {
  return (
    <CartesianChart
      slot="range-chart"
      bars
      floating
      legend={false}
      series={[
        { key: high, label: highLabel, color },
        { key: low, label: lowLabel, color },
      ]}
      {...props}
    >
      {({ data, x, band, y, active, progress }) => {
        const width = Math.min(Math.max(band * 0.36, 4), 14);
        return data.map((d, i) => {
          const a = y(Number(d[low]) || 0);
          const b = y(Number(d[high]) || 0);
          const mid = (a + b) / 2;
          const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
          // the capsule opens out from its middle
          const half = Math.max((Math.abs(a - b) / 2) * grow, width / 2);
          return (
            <rect
              key={i}
              x={x(i) - width / 2}
              y={mid - half}
              width={width}
              height={half * 2}
              rx={width / 2}
              fill={color}
              opacity={active === null || active === i ? 1 : 0.35}
              className="transition-opacity duration-200 motion-reduce:transition-none"
            />
          );
        });
      }}
    </CartesianChart>
  );
}
