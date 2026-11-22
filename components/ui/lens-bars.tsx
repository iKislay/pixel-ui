"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useReducedMotion } from "motion/react";
import { barPath, formatCompact, lensEdges } from "@/lib/chart";
import { ChartTable, ChartTooltip, chartFocus, useChartNav, useChartWidth, useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type LensBarsProps = Omit<ComponentProps<"figure">, "children"> & {
  data: { date: string; value: number }[];
  label: string;
  height?: number;
  format?: Format;
  color?: string;
};

const LENS = 16;
const TOP = 12;

const pretty = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const month = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });

export function LensBars({ data, label, height = 200, format = formatCompact, color = "var(--brand)", className, ...props }: LensBarsProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const barsRef = useRef<SVGGElement>(null);
  const ticksRef = useRef<SVGGElement>(null);
  const lens = useRef({ focus: 0, open: 0 });
  const reduce = useReducedMotion();
  const progress = useDrawIn();
  const { active, setActive, handlers } = useChartNav(data.length);
  const [pointerX, setPointerX] = useState<number | null>(null);
  const n = data.length;
  const slot = n ? width / n : 0;
  const top = Math.max(...data.map((d) => d.value), 0) || 1;
  const plot = height - TOP;
  const ticks = data.flatMap((d, i) => (d.date.slice(8, 10) === "01" ? [{ i, label: month(d.date) }] : []));

  useEffect(() => {
    const bars = barsRef.current?.children;
    const labels = ticksRef.current?.children;
    if (!bars || !labels || !n || !width) return;
    const state = lens.current;
    const open = active === null ? 0 : 1;
    const focus = active === null ? state.focus : (pointerX ?? (active + 0.5) * slot);
    // a lens opening from shut starts where it is aimed instead of sliding in from the last spot
    if (state.open < 0.02 || reduce) state.focus = focus;
    if (reduce) state.open = open;
    let frame = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const k = 1 - Math.exp(-(now - last) / 60);
      last = now;
      state.focus += (focus - state.focus) * k;
      state.open += (open - state.open) * k;
      const settled = Math.abs(focus - state.focus) < 0.1 && Math.abs(open - state.open) < 0.002;
      if (settled) Object.assign(state, { focus, open });

      const { edges, near } = lensEdges(n, width, state.focus, state.open, Math.max(1, LENS / slot));
      for (let i = 0; i < n; i++) {
        const span = edges[i + 1] - edges[i];
        const gap = Math.min(2, Math.max(0, (span - 3) * 0.3));
        const w = span - gap;
        const grow = Math.min(Math.max(progress * 1.6 - (i / n) * 0.6, 0), 1);
        const h = Math.max(0, data[i].value / top) * plot * grow;
        const bar = bars[i];
        bar.setAttribute("d", barPath(edges[i] + gap / 2, height, w, height - h, w >= 4 ? 3 : 0));
        bar.setAttribute("opacity", String(1 - 0.6 * state.open * (1 - near[i])));
      }
      let prev = -Infinity;
      ticks.forEach(({ i }, t) => {
        const x = Math.min(Math.max((edges[i] + edges[i + 1]) / 2, 12), width - 12);
        labels[t].setAttribute("x", String(x));
        // labels crowded onto a neighbour by the squeeze fade out instead of overlapping
        labels[t].setAttribute("opacity", String(Math.min(Math.max((x - prev - 24) / 12, 0), 1)));
        prev = x;
      });
      if (!settled) frame = requestAnimationFrame(draw);
    };

    draw(last);
    return () => cancelAnimationFrame(frame);
  }, [active, pointerX, width, height, plot, slot, n, data, top, progress, reduce, ticks]);

  const aim = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || !n) return;
    const x = Math.min(Math.max(clientX - box.left, 0), box.width - 0.01);
    setPointerX(x);
    setActive(Math.floor((x / box.width) * n));
  };

  const day = active === null ? null : data[active];

  return (
    <figure data-slot="lens-bars" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}, ${n} days. Use the arrow keys to read each day.`}
        className={cn("relative w-full cursor-crosshair touch-pan-y select-none", chartFocus)}
        style={{ height: height + 22 }}
        onPointerMove={(event) => aim(event.clientX)}
        onPointerDown={(event) => aim(event.clientX)}
        {...handlers}
        onKeyDown={(event) => {
          setPointerX(null);
          handlers.onKeyDown(event);
        }}
        onPointerLeave={() => {
          setPointerX(null);
          setActive(null);
        }}
      >
        {width > 0 && (
          <svg width={width} height={height + 22} aria-hidden className="block overflow-visible">
            <g ref={barsRef}>
              {data.map((d) => (
                <path key={d.date} fill={color} />
              ))}
            </g>
            <line x1={0} x2={width} y1={height + 0.5} y2={height + 0.5} className="stroke-border" />
            <g ref={ticksRef}>
              {ticks.map((t) => (
                <text key={t.i} y={height + 16} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
                  {t.label}
                </text>
              ))}
            </g>
          </svg>
        )}
        <ChartTooltip
          x={pointerX ?? (active === null ? 0 : (active + 0.5) * slot)}
          y={day ? height - (Math.max(0, day.value) / top) * plot : 0}
          width={width}
          title={day ? pretty(day.date) : undefined}
          rows={day ? [{ label, value: format(day.value), color }] : null}
        />
      </div>
      <ChartTable caption={label} columns={["Date", label]} rows={data.map((d) => [pretty(d.date), format(d.value)])} />
    </figure>
  );
}
