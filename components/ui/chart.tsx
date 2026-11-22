"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { animate, AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatCompact, niceTicks, scaleLinear, seriesColor } from "@/lib/chart";
import { cn } from "@/lib/utils";

export type ChartDatum = Record<string, string | number>;

export type ChartSeries = {
  key: string;
  label?: string;
  color?: string;
};

export type Format = (value: number) => string;

// a paint applied to a chart's marks only: svg defs it needs, a filter for the marks, and an optional series paint
export type ChartEffect = {
  defs: ReactNode;
  filter?: string;
  fill?: (color: string, index: number) => string;
};

// wraps marks inside an svg so the effect touches them and leaves axes, labels and tooltips plain
export function EffectLayer({ effect, children }: { effect?: ChartEffect; children: ReactNode }) {
  if (!effect) return <>{children}</>;
  return (
    <>
      <defs>{effect.defs}</defs>
      <g filter={effect.filter}>{children}</g>
    </>
  );
}

// html and canvas charts keep the effect's defs here and put effect.filter on their marks as a css filter
export function EffectDefs({ effect }: { effect?: ChartEffect }) {
  if (!effect) return null;
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0 overflow-hidden">
      <defs>{effect.defs}</defs>
    </svg>
  );
}

export function useChartWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

// one value from 0 to 1 that drives every draw-in, skipped under reduced motion
export function useDrawIn(delay = 0) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, 1, { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1], onUpdate: setProgress });
    return () => controls.stop();
  }, [reduce, delay]);

  return reduce ? 1 : progress;
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: ReactNode[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type TooltipRow = { label: string; value: string; color?: string };

export function ChartTooltip({
  x,
  y,
  width,
  title,
  rows,
}: {
  x: number;
  y: number;
  width: number;
  title?: string;
  rows: TooltipRow[] | null;
}) {
  const reduce = useReducedMotion();
  const left = Math.min(Math.max(x, 72), Math.max(width - 72, 72));

  return (
    <AnimatePresence>
      {rows && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1, left, top: y }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40 }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-[16px] border border-foreground/[0.06] bg-background/90 px-3 py-2 text-xs shadow-lg backdrop-blur-md [corner-shape:squircle]"
        >
          {title && <p className="mb-1 font-semibold text-muted-foreground">{title}</p>}
          {rows.map((row) => (
            <p key={row.label} className="flex items-center gap-2">
              {row.color && <span className="size-2 rounded-full" style={{ background: row.color }} />}
              <span className="text-muted-foreground">{row.label}</span>
              <span className="ml-auto pl-3 font-mono font-medium tabular-nums text-foreground">{row.value}</span>
            </p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// arrow keys walk the data (up and down by a row in a grid), home and end jump, escape lets go
export function useChartNav(count: number, columns = 1) {
  const [active, setActive] = useState<number | null>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const row = columns > 1 ? columns : 1;
    const step = { ArrowRight: 1, ArrowDown: row, ArrowLeft: -1, ArrowUp: -row }[event.key];
    let next: number | null | undefined;
    if (step) next = active === null ? 0 : (active + step + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else if (event.key === "Escape") next = null;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
  };

  return {
    active,
    setActive,
    handlers: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => setActive((current) => current ?? count - 1),
      onBlur: () => setActive(null),
      onPointerLeave: () => setActive(null),
    },
  };
}

export const chartFocus =
  "rounded-[inherit] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";

export type CartesianContext = {
  data: ChartDatum[];
  series: (ChartSeries & { color: string; label: string })[];
  width: number;
  height: number;
  x: (index: number) => number;
  band: number;
  y: (value: number) => number;
  top: number;
  floor: number;
  active: number | null;
  progress: number;
};

export type CartesianChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  index: string;
  series: ChartSeries[];
  label: string;
  height?: number;
  format?: Format;
  stacked?: boolean;
  zero?: boolean;
  bars?: boolean;
  bare?: boolean;
  grid?: boolean;
  floating?: boolean;
  legend?: boolean;
  header?: ReactNode;
  effect?: ChartEffect;
  slot: string;
  children: (context: CartesianContext) => ReactNode;
  // drawn above the marks and outside any effect: hover dots, tags, handles
  overlay?: (context: CartesianContext) => ReactNode;
};

const MARGIN = { top: 12, right: 8, bottom: 28, left: 40 };
const BARE = { top: 6, right: 6, bottom: 6, left: 6 };

export function CartesianChart({
  data,
  index,
  series: input,
  label,
  height = 240,
  format = formatCompact,
  stacked = false,
  zero = false,
  bars = false,
  bare = false,
  grid = true,
  floating = false,
  legend = true,
  header,
  effect,
  slot,
  children,
  overlay,
  className,
  ...props
}: CartesianChartProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const { active, setActive, handlers } = useChartNav(data.length);
  const progress = useDrawIn();
  const margin = bare ? BARE : grid ? MARGIN : { ...MARGIN, left: 8 };
  const series = input.map((s, i) => ({ ...s, label: s.label ?? s.key, color: seriesColor(i, s.color) }));

  const value = (row: ChartDatum, key: string) => Number(row[key]) || 0;
  const totals = data.map((row) =>
    stacked ? series.reduce((sum, s) => sum + value(row, s.key), 0) : Math.max(...series.map((s) => value(row, s.key))),
  );
  const lows = data.map((row) => Math.min(...series.map((s) => value(row, s.key))));
  const low = (bars && !floating) || stacked || zero ? Math.min(0, ...lows) : Math.min(...lows);
  const ticks = niceTicks(low, Math.max(...totals), bare ? 1 : 4);
  const domain: [number, number] = bare ? [Math.min(...lows), Math.max(...totals)] : [ticks[0], ticks.at(-1)!];

  const plotWidth = Math.max(width - margin.left - margin.right, 0);
  const plotHeight = height - margin.top - margin.bottom;
  const band = plotWidth / Math.max(data.length, 1);
  const x = (i: number) => margin.left + (bars ? band * (i + 0.5) : data.length > 1 ? (plotWidth * i) / (data.length - 1) : plotWidth / 2);
  const y = scaleLinear(domain, [margin.top + plotHeight, margin.top]);
  // keep about 48px between x labels
  const every = Math.max(Math.ceil(48 / (bars ? band : plotWidth / Math.max(data.length - 1, 1))), 1);

  const pick = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const offset = clientX - box.left - margin.left;
    const i = bars ? Math.floor(offset / band) : Math.round((offset / plotWidth) * (data.length - 1));
    setActive(Math.min(Math.max(i, 0), data.length - 1));
  };

  const row = active === null ? null : data[active];
  const context: CartesianContext = {
    data,
    series: effect?.fill ? series.map((s, i) => ({ ...s, color: effect.fill!(s.color, i) })) : series,
    width,
    height,
    x,
    band,
    y,
    top: margin.top,
    floor: y(domain[0]),
    active,
    progress,
  };

  return (
    <figure data-slot={slot} className={cn("flex w-full flex-col gap-3", className)} {...props}>
      {header}
      {!bare && legend && series.length > 1 && <ChartLegend items={series} />}
      <div
        ref={ref}
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each point.`}
        className={cn("relative w-full touch-pan-y", chartFocus)}
        style={{ height }}
        onPointerMove={(event) => pick(event.clientX)}
        onPointerDown={(event) => pick(event.clientX)}
        {...handlers}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block overflow-visible">
            {!bare &&
              grid &&
              ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke="currentColor"
                    className={tick === 0 ? "text-foreground/15" : "text-foreground/[0.06]"}
                  />
                  <text
                    x={margin.left - 10}
                    y={y(tick)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-muted-foreground font-mono text-[10px] tabular-nums"
                  >
                    {format(tick)}
                  </text>
                </g>
              ))}
            {!bare &&
              data.map((d, i) =>
                i % every === 0 ? (
                  <text
                    key={i}
                    x={x(i)}
                    y={height - 8}
                    textAnchor={bars ? "middle" : i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                    className="fill-muted-foreground text-[11px] font-medium"
                  >
                    {String(d[index])}
                  </text>
                ) : null,
              )}
            {active !== null && !bars && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={margin.top}
                y2={margin.top + plotHeight}
                stroke="currentColor"
                strokeDasharray="2 4"
                className="text-foreground/25"
              />
            )}
            <EffectLayer effect={effect}>{children(context)}</EffectLayer>
            {overlay?.(context)}
          </svg>
        )}
        <ChartTooltip
          x={active === null ? 0 : x(active)}
          y={active === null ? margin.top : y(totals[active])}
          width={width}
          title={row ? String(row[index]) : undefined}
          rows={
            row
              ? [
                  ...series.map((s) => ({ label: s.label, color: s.color, value: format(value(row, s.key)) })),
                  ...(stacked ? [{ label: "Total", value: format(totals[active!]) }] : []),
                ]
              : null
          }
        />
        <p aria-live="polite" className="sr-only">
          {row ? `${row[index]}: ${series.map((s) => `${s.label} ${format(value(row, s.key))}`).join(", ")}` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={[index, ...series.map((s) => s.label)]}
        rows={data.map((d) => [String(d[index]), ...series.map((s) => format(value(d, s.key)))])}
      />
    </figure>
  );
}
