"use client";

import type { ComponentProps } from "react";
import { formatCompact } from "@/lib/chart";
import { ChartTable, ChartTooltip, chartFocus, useChartNav, useChartWidth, useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type HeatmapProps = Omit<ComponentProps<"figure">, "children"> & {
  data: number[][];
  rows: string[];
  columns: string[];
  label: string;
  format?: Format;
  color?: string;
  gap?: number;
};

const LEFT = 44;
const TOP = 22;

export function Heatmap({
  data,
  rows,
  columns,
  label,
  format = formatCompact,
  color = "var(--brand)",
  gap = 3,
  className,
  ...props
}: HeatmapProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const { active, setActive, handlers } = useChartNav(rows.length * columns.length, columns.length);
  const values = data.flat();
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const cell = Math.max((width - LEFT) / columns.length, 0);
  const height = TOP + cell * rows.length;
  const every = Math.ceil(columns.length / Math.max(Math.floor((width - LEFT) / 36), 1));
  // the faintest cell keeps a little tint so a zero still reads as a cell
  const strength = (value: number) => 0.08 + ((value - min) / span) * 0.92;

  const pick = (clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || cell === 0) return;
    const c = Math.floor((clientX - box.left - LEFT) / cell);
    const r = Math.floor((clientY - box.top - TOP) / cell);
    setActive(c >= 0 && c < columns.length && r >= 0 && r < rows.length ? r * columns.length + c : null);
  };

  const r = active === null ? 0 : Math.floor(active / columns.length);
  const c = active === null ? 0 : active % columns.length;
  const current = active === null ? null : (data[r]?.[c] ?? 0);

  return (
    <figure data-slot="heatmap" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each cell.`}
        className={cn("relative w-full touch-pan-y", chartFocus)}
        style={{ height: height || undefined }}
        onPointerMove={(event) => pick(event.clientX, event.clientY)}
        onPointerDown={(event) => pick(event.clientX, event.clientY)}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            {columns.map((column, j) =>
              j % every === 0 ? (
                <text key={column} x={LEFT + cell * (j + 0.5)} y={TOP - 8} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
                  {column}
                </text>
              ) : null,
            )}
            {rows.map((row, i) => (
              <g key={row}>
                <text x={LEFT - 10} y={TOP + cell * (i + 0.5)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] font-medium">
                  {row}
                </text>
                {columns.map((column, j) => {
                  const value = data[i]?.[j] ?? 0;
                  const grow = Math.min(Math.max(progress * 1.6 - ((i + j) / (rows.length + columns.length)) * 0.6, 0), 1);
                  const on = active === i * columns.length + j;
                  return (
                    <rect
                      key={column}
                      x={LEFT + cell * j + gap / 2}
                      y={TOP + cell * i + gap / 2}
                      width={Math.max(cell - gap, 0)}
                      height={Math.max(cell - gap, 0)}
                      rx={Math.min(cell / 4, 8)}
                      fill={color}
                      fillOpacity={strength(value) * grow}
                      stroke={on ? "var(--foreground)" : "none"}
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            ))}
          </svg>
        )}
        <ChartTooltip
          x={LEFT + cell * (c + 0.5)}
          y={TOP + cell * r}
          width={width}
          title={current === null ? undefined : `${rows[r]} · ${columns[c]}`}
          rows={current === null ? null : [{ label: "Value", value: format(current), color }]}
        />
        <p aria-live="polite" className="sr-only">
          {current === null ? "" : `${rows[r]}, ${columns[c]}: ${format(current)}`}
        </p>
      </div>
      <div aria-hidden className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-muted-foreground">
        Less
        {[0.08, 0.31, 0.54, 0.77, 1].map((opacity) => (
          <span key={opacity} className="size-3 rounded-[4px]" style={{ background: color, opacity }} />
        ))}
        More
      </div>
      <ChartTable
        caption={label}
        columns={["", ...columns]}
        rows={rows.map((row, i) => [row, ...columns.map((_, j) => format(data[i]?.[j] ?? 0))])}
      />
    </figure>
  );
}
