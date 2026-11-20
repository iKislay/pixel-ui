"use client";

import { useId } from "react";
import { linePath, smoothPath, type Point } from "@/lib/chart";
import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type AreaChartProps = Omit<CartesianChartProps, "children" | "slot" | "stacked" | "bars" | "bare"> & {
  curve?: "smooth" | "linear";
};

export function AreaChart({ curve = "smooth", ...props }: AreaChartProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const draw = curve === "smooth" ? smoothPath : linePath;

  return (
    <CartesianChart slot="area-chart" {...props}>
      {({ data, series, x, y, floor, active, progress }) =>
        series.map((s, index) => {
          const points = data.map((d, i): Point => [x(i), y(Number(d[s.key]) || 0)]);
          const line = draw(points);
          const fill = `${id}-${index}`;
          return (
            <g key={s.key}>
              <defs>
                <linearGradient id={fill} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path
                d={`${line}L${points.at(-1)![0]},${floor}L${points[0][0]},${floor}Z`}
                fill={`url(#${fill})`}
                opacity={progress}
                style={{ transform: `translateY(${(1 - progress) * 12}px)` }}
              />
              <path
                d={line}
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
                <circle cx={points[active][0]} cy={points[active][1]} r={4.5} fill={s.color} stroke="var(--background)" strokeWidth={2} />
              )}
            </g>
          );
        })
      }
    </CartesianChart>
  );
}
