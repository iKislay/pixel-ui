"use client";

import type { ComponentProps } from "react";
import { calendarCells, formatCompact } from "@/lib/chart";
import { ChartTable, ChartTooltip, chartFocus, useChartNav, useChartWidth, useDrawIn, type Format, EffectLayer, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type CalendarHeatmapProps = Omit<ComponentProps<"figure">, "children"> & {
  data: { date: string; value: number }[];
  label: string;
  format?: Format;
  color?: string;
  effect?: ChartEffect;
};

const LEFT = 30;
const TOP = 20;
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
const LEVELS = [0.07, 0.3, 0.52, 0.76, 1];

const pretty = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

export function CalendarHeatmap({ data, label, format = formatCompact, color = "var(--brand)", effect, className, ...props }: CalendarHeatmapProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const { weeks, cells, months } = calendarCells(data);
  const { active, setActive, handlers } = useChartNav(cells.length);
  const top = Math.max(...cells.map((c) => c.value), 0);
  const size = weeks > 0 ? Math.min((width - LEFT) / weeks, 18) : 0;
  const level = (value: number) => (value <= 0 || top === 0 ? LEVELS[0] : LEVELS[Math.min(Math.ceil((value / top) * 4), 4)]);

  const pick = (clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || size === 0) return;
    const week = Math.floor((clientX - box.left - LEFT) / size);
    const day = Math.floor((clientY - box.top - TOP) / size);
    const found = cells.findIndex((c) => c.week === week && c.day === day);
    setActive(found === -1 ? null : found);
  };

  const cell = active === null ? null : cells[active];

  return (
    <figure data-slot="calendar-heatmap" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each day.`}
        className={cn("relative w-full touch-pan-y", chartFocus)}
        style={{ height: TOP + size * 7 || undefined }}
        onPointerMove={(event) => pick(event.clientX, event.clientY)}
        onPointerDown={(event) => pick(event.clientX, event.clientY)}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={TOP + size * 7} aria-hidden className="block overflow-visible">
            {months.map((month) => (
              <text key={`${month.label}${month.week}`} x={LEFT + month.week * size} y={TOP - 8} className="fill-muted-foreground text-[11px] font-medium">
                {month.label}
              </text>
            ))}
            {DAYS.map((day, i) =>
              day ? (
                <text key={day} x={0} y={TOP + size * (i + 0.5)} dy="0.32em" className="fill-muted-foreground text-[10px] font-medium">
                  {day}
                </text>
              ) : null,
            )}
            <EffectLayer effect={effect}>
              {cells.map((c) => {
                const shown = Math.min(Math.max(progress * 1.5 - (c.week / Math.max(weeks, 1)) * 0.5, 0), 1);
                return (
                  <rect
                    key={c.date}
                    x={LEFT + c.week * size + 1.5}
                    y={TOP + c.day * size + 1.5}
                    width={Math.max(size - 3, 0)}
                    height={Math.max(size - 3, 0)}
                    rx={size / 3.5}
                    fill={color}
                    fillOpacity={level(c.value) * shown}
                  />
                );
              })}
            </EffectLayer>
            {cell && (
              <rect
                x={LEFT + cell.week * size + 1.5}
                y={TOP + cell.day * size + 1.5}
                width={Math.max(size - 3, 0)}
                height={Math.max(size - 3, 0)}
                rx={size / 3.5}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth={1.5}
              />
            )}
          </svg>
        )}
        <ChartTooltip
          x={cell ? LEFT + (cell.week + 0.5) * size : 0}
          y={cell ? TOP + cell.day * size : 0}
          width={width}
          title={cell ? pretty(cell.date) : undefined}
          rows={cell ? [{ label: "Value", value: format(cell.value), color }] : null}
        />
        <p aria-live="polite" className="sr-only">
          {cell ? `${pretty(cell.date)}: ${format(cell.value)}` : ""}
        </p>
      </div>
      <div aria-hidden className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-muted-foreground">
        Less
        {LEVELS.map((opacity) => (
          <span key={opacity} className="size-3 rounded-[4px]" style={{ background: color, opacity }} />
        ))}
        More
      </div>
      <ChartTable caption={label} columns={["Date", "Value"]} rows={cells.map((c) => [c.date, format(c.value)])} />
    </figure>
  );
}
