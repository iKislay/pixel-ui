"use client";

import { useId, type ComponentProps } from "react";
import { formatCompact, ribbonPath, seriesColor } from "@/lib/chart";
import { ChartTable, chartFocus, useChartNav, useChartWidth, useDrawIn, type Format, EffectLayer, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type FlowHubItem = { label: string; value: number; color?: string };

export type FlowHubProps = Omit<ComponentProps<"figure">, "children"> & {
  inputs: FlowHubItem[];
  outputs: FlowHubItem[];
  label: string;
  totalLabel?: string;
  format?: Format;
  height?: number;
  effect?: ChartEffect;
};

const SIDE = 104;
const GAP = 16;
const NODE = 6;

type Placed = FlowHubItem & { side: "in" | "out"; color: string; y: number; h: number; hubY: number; hubH: number };

// stacks one side's items down the full height, and again squeezed into the hub
function stack(items: FlowHubItem[], side: "in" | "out", k: number, height: number, hub: number, offset: number): Placed[] {
  const total = items.reduce((a, d) => a + Math.max(d.value, 0), 0);
  let y = (height - total * k - GAP * (items.length - 1)) / 2;
  let hubY = height / 2 - (total * k * hub) / 2;
  return items.map((d, i) => {
    const h = Math.max(d.value, 0) * k;
    const placed = { ...d, side, color: seriesColor((i + offset) % 5, d.color), y, h, hubY, hubH: h * hub };
    y += h + GAP;
    hubY += h * hub;
    return placed;
  });
}

export function FlowHub({
  inputs,
  outputs,
  label,
  totalLabel = "Total",
  format = formatCompact,
  height = 300,
  effect,
  className,
  ...props
}: FlowHubProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const items = [...inputs, ...outputs];
  const { active, setActive, handlers } = useChartNav(items.length);
  const sum = (list: FlowHubItem[]) => list.reduce((a, d) => a + Math.max(d.value, 0), 0);
  const total = sum(inputs);
  const k = Math.min(...[inputs, outputs].map((list) => (height - GAP * (list.length - 1)) / (sum(list) || 1)));
  // label gutters shrink on narrow screens, and the disc never outgrows the space between them
  const side = Math.min(SIDE, Math.max(60, width * 0.22));
  const r = Math.min(height * 0.3, 86, Math.max((width - side * 2) / 2 - 12, 24));
  const hub = Math.min((r * 1.5) / (Math.max(sum(inputs), sum(outputs)) * k || 1), 1);
  const placed = [...stack(inputs, "in", k, height, hub, 0), ...stack(outputs, "out", k, height, hub, inputs.length)];
  const cx = width / 2;
  const current = active === null ? null : placed[active];

  return (
    <figure data-slot="flow-hub" className={cn("w-full", className)} {...props}>
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each flow.`}
        className={cn("relative w-full", chartFocus)}
        style={{ height }}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            <defs>
              {placed.map((p, i) => (
                <linearGradient
                  key={i}
                  id={`${id}-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={p.side === "in" ? side : cx}
                  x2={p.side === "in" ? cx : width - side}
                >
                  <stop offset="0%" stopColor={p.color} stopOpacity={p.side === "in" ? 0.75 : 0.12} />
                  <stop offset="100%" stopColor={p.color} stopOpacity={p.side === "in" ? 0.12 : 0.75} />
                </linearGradient>
              ))}
            </defs>
            <EffectLayer effect={effect}>
              {placed.map((p, i) => {
                const edge = p.side === "in" ? side + NODE : width - side - NODE;
                // ribbons reach in from the edges as the chart draws
                const reach = edge + (cx - edge) * progress;
                return (
                  <path
                    key={i}
                    d={p.side === "in" ? ribbonPath(edge, p.y, reach, p.hubY, p.h, p.hubH) : ribbonPath(reach, p.hubY, edge, p.y, p.hubH, p.h)}
                    fill={`url(#${id}-${i})`}
                    onPointerEnter={() => setActive(i)}
                    opacity={active !== null && active !== i ? 0.25 : 1}
                    className="transition-opacity duration-200 motion-reduce:transition-none"
                  />
                );
              })}
            </EffectLayer>
            {placed.map((p, i) => {
              const dim = active !== null && active !== i;
              return (
                <g key={i} onPointerEnter={() => setActive(i)} opacity={dim ? 0.25 : 1} className="transition-opacity duration-200 motion-reduce:transition-none">
                  <rect x={p.side === "in" ? side : width - side - NODE} y={p.y} width={NODE} height={Math.max(p.h, 2)} rx={NODE / 2} fill={p.color} />
                  <text
                    x={p.side === "in" ? side - 12 : width - side + 12}
                    y={p.y + p.h / 2}
                    textAnchor={p.side === "in" ? "end" : "start"}
                    className="fill-foreground text-[12px] font-semibold"
                  >
                    <tspan x={p.side === "in" ? side - 12 : width - side + 12} dy="-0.2em">
                      {p.label}
                    </tspan>
                    <tspan
                      x={p.side === "in" ? side - 12 : width - side + 12}
                      dy="1.25em"
                      className="fill-muted-foreground font-mono text-[10px] font-medium"
                    >
                      {format(p.value)}
                    </tspan>
                  </text>
                </g>
              );
            })}
            <circle cx={cx} cy={height / 2} r={r + 10} className="fill-foreground/[0.03]" />
            <circle cx={cx} cy={height / 2} r={r} className="fill-background stroke-foreground/[0.06]" style={{ filter: "drop-shadow(0 8px 24px rgb(0 0 0 / 0.08))" }} />
          </svg>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-32 truncate text-xs font-semibold text-muted-foreground">{current ? current.label : totalLabel}</span>
          <span className="font-mono text-3xl font-medium tabular-nums">{format(current ? current.value : total * progress)}</span>
          {current && (
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{Math.round((Math.max(current.value, 0) / (total || 1)) * 100)}%</span>
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {current ? `${current.side === "in" ? "In" : "Out"}: ${current.label}, ${format(current.value)}` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={["Flow", "Direction", "Value"]}
        rows={placed.map((p) => [p.label, p.side === "in" ? "In" : "Out", format(p.value)])}
      />
    </figure>
  );
}
