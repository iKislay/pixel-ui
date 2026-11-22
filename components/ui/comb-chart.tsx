"use client";

import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type CombChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend" | "grid">;

export function CombChart(props: CombChartProps) {
  return (
    // its teeth are lines, which never take the effect, so the chart draws in the overlay
    <CartesianChart
      slot="comb-chart"
      bars
      grid={false}
      {...props}
      overlay={({ data, series, x, band, y, floor, active, progress }) => {
        const s = series[0];
        const width = Math.min(Math.max(band * 0.45, 2), 8);
        return data.map((d, i) => {
          const grow = Math.min(Math.max(progress * 1.6 - (i / data.length) * 0.6, 0), 1);
          const end = floor + (y(Math.max(Number(d[s.key]) || 0, 0)) - floor) * grow;
          // older teeth fade so the eye lands on the latest values
          const recency = 0.25 + 0.75 * (i / Math.max(data.length - 1, 1));
          return (
            <line
              key={i}
              x1={x(i)}
              x2={x(i)}
              y1={floor - width / 2}
              y2={Math.min(end + width / 2, floor - width / 2)}
              stroke={s.color}
              strokeWidth={width}
              strokeLinecap="round"
              opacity={active === null ? recency : active === i ? 1 : 0.2}
            />
          );
        });
      }}
    >
      {() => null}
    </CartesianChart>
  );
}
