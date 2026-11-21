"use client";

import type { ComponentProps } from "react";
import { formatCompact, niceTicks, scaleLinear, seriesColor } from "@/lib/chart";
import { ChartTable, ChartTooltip, chartFocus, useChartNav, useChartWidth, useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type GanttTask = { label: string; start: number; end: number; progress?: number; color?: string };

export type GanttChartProps = Omit<ComponentProps<"figure">, "children"> & {
  tasks: GanttTask[];
  label: string;
  formatTime?: Format;
  rowHeight?: number;
};

const LEFT = 76;
const TOP = 26;

export function GanttChart({ tasks, label, formatTime = formatCompact, rowHeight = 40, className, ...props }: GanttChartProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const progress = useDrawIn();
  const { active, setActive, handlers } = useChartNav(tasks.length);
  // tasks that share a label share a row, in order of first appearance
  const rows = [...new Set(tasks.map((t) => t.label))];
  const ticks = niceTicks(Math.min(...tasks.map((t) => t.start)), Math.max(...tasks.map((t) => t.end)), 6);
  const x = scaleLinear([ticks[0], ticks.at(-1)!], [LEFT, Math.max(width - 8, LEFT)]);
  const height = TOP + rows.length * rowHeight;
  const bar = Math.min(rowHeight - 14, 26);
  const task = active === null ? null : tasks[active];
  const done = (t: GanttTask) => (t.progress ?? 0) >= 1;
  const percent = (t: GanttTask) => `${Math.round(Math.min(Math.max(t.progress ?? 0, 0), 1) * 100)}%`;

  return (
    <figure data-slot="gantt-chart" className={cn("w-full", className)} {...props}>
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each task.`}
        className={cn("relative w-full", chartFocus)}
        style={{ height }}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={x(tick)} x2={x(tick)} y1={TOP - 6} y2={height} stroke="currentColor" className="text-foreground/[0.05]" />
                <text x={x(tick)} y={TOP - 12} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px] tabular-nums">
                  {formatTime(tick)}
                </text>
              </g>
            ))}
            {rows.map((row, r) => (
              <text key={row} x={0} y={TOP + rowHeight * (r + 0.5)} dy="0.32em" className="fill-muted-foreground text-[12px] font-semibold">
                {row}
              </text>
            ))}
            {tasks.map((t, i) => {
              const row = rows.indexOf(t.label);
              const color = seriesColor(row % 5, t.color);
              const left = x(t.start);
              const full = Math.max(x(t.end) - left, bar);
              const grow = Math.min(Math.max(progress * 1.4 - (i / tasks.length) * 0.4, 0), 1);
              const span = full * grow;
              const y = TOP + rowHeight * row + (rowHeight - bar) / 2;
              const inner = Math.max((span - 8) * Math.min(Math.max(t.progress ?? 0, 0), 1), 0);
              return (
                <g
                  key={i}
                  onPointerEnter={() => setActive(i)}
                  opacity={active === null || active === i ? 1 : 0.4}
                  className="transition-opacity duration-200 motion-reduce:transition-none"
                >
                  <rect x={left} y={y} width={span} height={bar} rx={bar / 2} fill={color} fillOpacity={done(t) ? 1 : 0.28} />
                  {!done(t) && inner > 0 && (
                    <rect x={left + 4} y={y + 4} width={Math.max(inner, bar - 8)} height={bar - 8} rx={(bar - 8) / 2} fill={color} />
                  )}
                  {grow === 1 &&
                    (done(t) ? (
                      <path
                        d={`M${left + span - bar / 2 - 5},${y + bar / 2}l3.5,3.5l6.5,-7`}
                        fill="none"
                        stroke="white"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      span > 64 && (
                        <text x={left + span - 10} y={y + bar / 2} dy="0.35em" textAnchor="end" className="fill-foreground font-mono text-[10px] font-medium tabular-nums">
                          {percent(t)}
                        </text>
                      )
                    ))}
                </g>
              );
            })}
          </svg>
        )}
        <ChartTooltip
          x={task ? (x(task.start) + x(task.end)) / 2 : 0}
          y={task ? TOP + rowHeight * rows.indexOf(task.label) + (rowHeight - bar) / 2 : 0}
          width={width}
          title={task?.label}
          rows={
            task
              ? [
                  { label: "Time", value: `${formatTime(task.start)} – ${formatTime(task.end)}` },
                  { label: "Progress", value: done(task) ? "Done" : percent(task), color: seriesColor(rows.indexOf(task.label) % 5, task.color) },
                ]
              : null
          }
        />
        <p aria-live="polite" className="sr-only">
          {task ? `${task.label}, ${formatTime(task.start)} to ${formatTime(task.end)}, ${done(task) ? "done" : `${percent(task)} done`}` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={["Task", "Start", "End", "Progress"]}
        rows={tasks.map((t) => [t.label, formatTime(t.start), formatTime(t.end), done(t) ? "Done" : percent(t)])}
      />
    </figure>
  );
}
