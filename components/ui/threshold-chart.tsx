"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import { barPath, formatCompact, niceTicks } from "@/lib/chart";
import { CartesianChart, type CartesianChartProps } from "@/components/ui/chart";

export type ThresholdChartProps = Omit<
  CartesianChartProps,
  "children" | "slot" | "series" | "stacked" | "bars" | "bare" | "zero" | "floating" | "legend" | "header"
> & {
  value: string;
  valueLabel?: string;
  threshold?: number;
  defaultThreshold?: number;
  onThresholdChange?: (threshold: number) => void;
  direction?: "above" | "below";
  step?: number;
  caption?: string;
  color?: string;
};

export function ThresholdChart({
  data,
  value,
  valueLabel,
  threshold,
  defaultThreshold,
  onThresholdChange,
  direction = "above",
  step,
  caption,
  color = "var(--brand)",
  format = formatCompact,
  label,
  ...props
}: ThresholdChartProps) {
  const clip = useId();
  const values = data.map((d) => Number(d[value]) || 0);
  // mirrors the domain the chart frame picks for a single bar series
  const ticks = niceTicks(Math.min(0, ...values), Math.max(...values), 4);
  const [low, high] = [ticks[0], ticks.at(-1)!];
  const unit = step ?? niceTicks(low, high, 40)[1] - low;
  const snap = (v: number) => Math.min(high, Math.max(low, +(Math.round(v / unit) * unit).toPrecision(12)));

  const [own, setOwn] = useState(() => snap(defaultThreshold ?? Math.max(...values, 0) * 0.7));
  const line = snap(threshold ?? own);
  const set = (v: number) => {
    const next = snap(v);
    if (next === line) return;
    if (threshold === undefined) setOwn(next);
    onThresholdChange?.(next);
  };

  const above = direction === "above";
  const fires = (v: number) => (above ? v > line : v < line);
  const count = values.filter(fires).length;
  const [focused, setFocused] = useState(false);
  const dragging = useRef(false);

  return (
    <CartesianChart
      slot="threshold-chart"
      bars
      legend={false}
      label={label}
      format={format}
      data={data}
      series={[{ key: value, label: valueLabel ?? value, color }]}
      header={
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{count}</span>
          <span className="text-sm text-muted-foreground">
            of {data.length} {caption ?? (above ? "over the line" : "under the line")}
          </span>
          <input
            type="range"
            className="sr-only"
            aria-label={`${label} threshold`}
            aria-valuetext={`${format(line)}, ${count} of ${data.length} ${above ? "over" : "under"}`}
            min={low}
            max={high}
            step={unit}
            value={line}
            onChange={(event) => set(Number(event.target.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      }
      {...props}
    >
      {({ x, band, y, top, floor, active, progress }) => {
        const base = y(0);
        const width = Math.min(band * 0.64, 28);
        const left = x(0) - band / 2;
        const right = x(data.length - 1) + band / 2;
        const ly = y(line);
        const toValue = (event: PointerEvent<SVGRectElement>) => {
          const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
          return low + ((floor - (event.clientY - box.top)) / (floor - top)) * (high - low);
        };
        const drag = {
          onPointerDown: (event: PointerEvent<SVGRectElement>) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            dragging.current = true;
            set(toValue(event));
          },
          onPointerMove: (event: PointerEvent<SVGRectElement>) => {
            if (!dragging.current) return;
            event.stopPropagation();
            set(toValue(event));
          },
          onPointerUp: () => (dragging.current = false),
          onPointerCancel: () => (dragging.current = false),
        };
        const tag = format(line);
        const tagWidth = tag.length * 7 + 16;

        return (
          <>
            <clipPath id={clip}>
              <rect x={left} width={right - left} {...(above ? { y: top - 8, height: Math.max(ly - top + 8, 0) } : { y: ly, height: Math.max(floor - ly, 0) })} />
            </clipPath>
            {data.map((d, i) => {
              // each bar rises a beat after the one before it
              const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
              const path = barPath(x(i) - width / 2, base, width, base + (y(values[i]) - base) * grow, 6);
              const on = active === null || active === i;
              return (
                <g key={i} opacity={on ? 1 : 0.45} className="transition-opacity duration-200 motion-reduce:transition-none">
                  <path d={path} fill={color} opacity={0.35} />
                  {fires(values[i]) && <path d={path} fill="var(--destructive)" clipPath={above ? `url(#${clip})` : undefined} />}
                </g>
              );
            })}
            <line x1={left} x2={right} y1={ly} y2={ly} stroke="var(--destructive)" strokeWidth={1.5} strokeDasharray="4 3" />
            <g transform={`translate(${right - tagWidth},${ly - 10})`}>
              <rect
                width={tagWidth}
                height={20}
                rx={10}
                fill="var(--destructive)"
                stroke={focused ? "var(--brand)" : "none"}
                strokeWidth={2}
              />
              <text x={tagWidth / 2} y={10} dy="0.34em" textAnchor="middle" className="fill-white font-mono text-[11px] font-semibold tabular-nums">
                {tag}
              </text>
            </g>
            <rect
              x={left}
              y={ly - 12}
              width={right - left}
              height={24}
              fill="transparent"
              className="cursor-ns-resize touch-none"
              {...drag}
            />
          </>
        );
      }}
    </CartesianChart>
  );
}
