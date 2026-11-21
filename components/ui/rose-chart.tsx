"use client";

import { useId, type ComponentProps } from "react";
import { arcPath, formatCompact, seriesColor } from "@/lib/chart";
import { ChartTable, chartFocus, useChartNav, useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type RoseDatum = { label: string; value: number; color?: string };

export type RoseChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: RoseDatum[];
  label: string;
  format?: Format;
};

const C = 100;
const INNER = 18;
const OUTER = 94;
// petals are drawn this much smaller and stroked back out, which rounds every corner
const SOFT = 4;

export function RoseChart({ data, label, format = formatCompact, className, ...props }: RoseChartProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const { active, setActive, handlers } = useChartNav(data.length);
  const progress = useDrawIn();
  const top = Math.max(...data.map((d) => d.value), 0) || 1;
  const step = (Math.PI * 2) / Math.max(data.length, 1);
  const pad = 0.05;
  // radius by square root so a petal's area, not its length, matches its value
  const reach = (value: number) => INNER + (OUTER - INNER) * Math.sqrt(Math.max(value, 0) / top);
  const current = active === null ? null : data[active];

  return (
    <figure data-slot="rose-chart" className={cn("flex flex-wrap items-center justify-center gap-x-10 gap-y-6", className)} {...props}>
      <div
        role="group"
        aria-roledescription="chart"
        aria-label={`${label}. Use the arrow keys to read each petal.`}
        className={cn("relative aspect-square w-full max-w-[240px] rounded-full", chartFocus)}
        {...handlers}
      >
        <svg viewBox="0 0 200 200" aria-hidden className="size-full overflow-visible">
          <defs>
            <pattern id={id} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={5} stroke="currentColor" strokeWidth={1.5} className="text-foreground/15" />
            </pattern>
          </defs>
          {data.map((d, i) => {
            const start = i * step + pad;
            const end = (i + 1) * step - pad;
            const color = seriesColor(i % 5, d.color);
            const grow = Math.min(Math.max(progress * 1.4 - (i / data.length) * 0.4, 0), 1);
            const r = INNER + (reach(d.value) - INNER) * grow;
            const lit = active === null || active === i;
            return (
              <g key={d.label} onPointerEnter={() => setActive(i)}>
                <path d={arcPath(C, C, OUTER - SOFT, INNER + SOFT, start, end)} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={SOFT * 2} strokeLinejoin="round" />
                {r - SOFT > INNER + SOFT && (
                  <path
                    d={arcPath(C, C, r - SOFT, INNER + SOFT, start, end)}
                    fill={color}
                    stroke={color}
                    strokeWidth={SOFT * 2}
                    strokeLinejoin="round"
                    opacity={lit ? 1 : 0.35}
                    className="transition-opacity duration-200 motion-reduce:transition-none"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <p aria-live="polite" className="sr-only">
          {current ? `${current.label}: ${format(current.value)}` : ""}
        </p>
      </div>
      <ul aria-hidden className="flex min-w-40 flex-col gap-2 text-sm" onPointerLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <li
            key={d.label}
            onPointerEnter={() => setActive(i)}
            className={cn(
              "flex items-center gap-2.5 transition-opacity duration-200 motion-reduce:transition-none",
              active !== null && active !== i && "opacity-40",
            )}
          >
            <span className="size-2.5 rounded-full" style={{ background: seriesColor(i % 5, d.color) }} />
            <span className="font-semibold text-muted-foreground">{d.label}</span>
            <span className="ml-auto pl-4 font-mono font-medium tabular-nums">{format(d.value)}</span>
          </li>
        ))}
      </ul>
      <ChartTable caption={label} columns={["Petal", "Value"]} rows={data.map((d) => [d.label, format(d.value)])} />
    </figure>
  );
}
