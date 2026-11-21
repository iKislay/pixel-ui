"use client";

import { linePath, smoothPath, type Point } from "@/lib/chart";
import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type LineChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend"> & {
  curve?: "smooth" | "linear";
};

export function LineChart({ curve = "smooth", ...props }: LineChartProps) {
  const draw = curve === "smooth" ? smoothPath : linePath;

  return (
    <CartesianChart slot="line-chart" {...props}>
      {({ data, series, x, y, active, progress }) =>
        series.map((s) => {
          const points = data.map((d, i): Point => [x(i), y(Number(d[s.key]) || 0)]);
          return (
            <g key={s.key}>
              <path
                d={draw(points)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - progress}
              />
              {active !== null && (
                <circle
                  cx={points[active][0]}
                  cy={points[active][1]}
                  r={4.5}
                  fill={s.color}
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })
      }
    </CartesianChart>
  );
}
