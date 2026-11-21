"use client";

import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type LollipopChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend">;

export function LollipopChart(props: LollipopChartProps) {
  return (
    <CartesianChart slot="lollipop-chart" bars {...props}>
      {({ data, series, x, band, y, floor, active, progress }) => {
        const step = Math.min(band * 0.5 / series.length, 18);
        return data.map((d, i) => {
          const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
          return series.map((s, j) => {
            const cx = x(i) + (j - (series.length - 1) / 2) * step;
            const cy = floor + (y(Number(d[s.key]) || 0) - floor) * grow;
            const on = active === null || active === i;
            return (
              <g key={`${i}-${s.key}`} opacity={on ? 1 : 0.4} className="transition-opacity duration-200 motion-reduce:transition-none">
                <line x1={cx} x2={cx} y1={floor} y2={cy} stroke={s.color} strokeWidth={2} strokeLinecap="round" />
                <circle cx={cx} cy={cy} r={active === i ? 7 : 5.5} fill={s.color} stroke="var(--background)" strokeWidth={2} />
              </g>
            );
          });
        });
      }}
    </CartesianChart>
  );
}
