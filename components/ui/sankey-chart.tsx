"use client";

import { useId, useState, type ComponentProps } from "react";
import { formatCompact, ribbonPath, sankeyLayout, seriesColor, type SankeyLinkInput, type SankeyNodeInput } from "@/lib/chart";
import { ChartTable, ChartTooltip, chartFocus, useChartNav, useChartWidth, useDrawIn, type Format, EffectLayer, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type SankeyChartProps = Omit<ComponentProps<"figure">, "children"> & {
  nodes: SankeyNodeInput[];
  links: SankeyLinkInput[];
  label: string;
  format?: Format;
  height?: number;
  nodeWidth?: number;
  effect?: ChartEffect;
};

const SIDE = 112;

export function SankeyChart({
  nodes,
  links,
  label,
  format = formatCompact,
  height = 320,
  nodeWidth = 10,
  effect,
  className,
  ...props
}: SankeyChartProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const [node, setNode] = useState<number | null>(null);
  const layout = sankeyLayout(nodes, links, { width: Math.max(width - SIDE * 2, 0), height, nodeWidth });
  const { active, setActive, handlers } = useChartNav(layout.links.length);
  const color = (i: number) => seriesColor(i % 5, nodes[i].color);
  const name = (i: number) => nodes[i].label ?? nodes[i].id;
  const lit = (l: { s: number; t: number }, i: number) =>
    active !== null ? active === i : node !== null ? l.s === node || l.t === node : true;
  const link = active === null ? null : layout.links[active];

  return (
    <figure data-slot="sankey-chart" className={cn("w-full", className)} {...props}>
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each flow.`}
        className={cn("relative w-full", chartFocus)}
        style={{ height }}
        {...handlers}
        onPointerLeave={() => {
          setNode(null);
          setActive(null);
        }}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            <defs>
              <clipPath id={`${id}-reveal`}>
                <rect x={0} y={-8} width={SIDE + (width - SIDE * 2) * progress} height={height + 16} />
              </clipPath>
              {layout.links.map((l, i) => (
                <linearGradient key={i} id={`${id}-${i}`} gradientUnits="userSpaceOnUse" x1={SIDE + l.x0} x2={SIDE + l.x1}>
                  <stop offset="0%" stopColor={color(l.s)} />
                  <stop offset="100%" stopColor={color(l.t)} />
                </linearGradient>
              ))}
            </defs>
            <EffectLayer effect={effect}>
              <g clipPath={`url(#${id}-reveal)`} transform={`translate(${SIDE},0)`}>
                {layout.links.map((l, i) => (
                  <path
                    key={i}
                    d={ribbonPath(l.x0, l.sy, l.x1, l.ty, Math.max(l.w, 1))}
                    fill={`url(#${id}-${i})`}
                    fillOpacity={lit(l, i) ? 0.42 : 0.1}
                    onPointerEnter={() => setActive(i)}
                    className="transition-[fill-opacity] duration-200 motion-reduce:transition-none"
                  />
                ))}
              </g>
            </EffectLayer>
            <g transform={`translate(${SIDE},0)`}>
              {layout.nodes.map((n) => {
                const tx = n.column === 0 ? n.x - 10 : n.x + nodeWidth + 10;
                return (
                  <g
                    key={n.id}
                    onPointerEnter={() => {
                      setActive(null);
                      setNode(n.index);
                    }}
                  >
                    <rect x={n.x} y={n.y} width={nodeWidth} height={Math.max(n.h, 2)} rx={nodeWidth / 2} fill={color(n.index)} />
                    <text
                      y={n.y + n.h / 2}
                      textAnchor={n.column === 0 ? "end" : "start"}
                      className="fill-foreground text-[12px] font-semibold"
                    >
                      <tspan x={tx} dy="-0.2em">
                        {name(n.index)}
                      </tspan>
                      <tspan x={tx} dy="1.25em" className="fill-muted-foreground font-mono text-[10px] font-medium">
                        {format(n.value)}
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
        <ChartTooltip
          x={link ? SIDE + (link.x0 + link.x1) / 2 : 0}
          y={link ? (link.sy + link.ty) / 2 : 0}
          width={width}
          title={link ? `${name(link.s)} → ${name(link.t)}` : undefined}
          rows={link ? [{ label: "Flow", value: format(link.value), color: color(link.s) }] : null}
        />
        <p aria-live="polite" className="sr-only">
          {link ? `${name(link.s)} to ${name(link.t)}: ${format(link.value)}` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={["From", "To", "Value"]}
        rows={layout.links.map((l) => [name(l.s), name(l.t), format(l.value)])}
      />
    </figure>
  );
}
