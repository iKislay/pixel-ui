"use client";

import { useId } from "react";
import { smoothPath, type Point } from "@/lib/chart";
import { CartesianChart, type CartesianChartProps, type Format } from "@/components/ui/chart";

export type SparklineProps = Omit<CartesianChartProps, "children" | "slot" | "data" | "index" | "series" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend"> & {
  data: number[];
  labels?: string[];
  color?: string;
  format?: Format;
};

export function Sparkline({ data, labels, color = "var(--brand)", height = 48, ...props }: SparklineProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const rows = data.map((value, i) => ({ point: labels?.[i] ?? String(i + 1), value }));

  return (
    <CartesianChart
      slot="sparkline"
      bare
      data={rows}
      index="point"
      series={[{ key: "value", label: props.label, color }]}
      height={height}
      {...props}
      overlay={({ x, y, active, progress }) => {
        const points = data.map((value, i): Point => [x(i), y(value)]);
        const end = points[active ?? points.length - 1];
        return (
          <>
            <path
              d={smoothPath(points)}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - progress}
            />
            {end && progress === 1 && <circle cx={end[0]} cy={end[1]} r={3.5} fill={color} stroke="var(--background)" strokeWidth={2} />}
          </>
        );
      }}
    >
      {({ x, y, floor, progress }) => {
        const points = data.map((value, i): Point => [x(i), y(value)]);
        const line = smoothPath(points);
        return (
          <>
            <defs>
              <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`${line}L${points.at(-1)![0]},${floor}L${points[0][0]},${floor}Z`} fill={`url(#${id})`} opacity={progress} />
          </>
        );
      }}
    </CartesianChart>
  );
}
