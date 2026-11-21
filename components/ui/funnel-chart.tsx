"use client";

import { Fragment, useState, type ComponentProps } from "react";
import { formatCompact } from "@/lib/chart";
import { useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type FunnelStep = { label: string; value: number };

export type FunnelChartProps = Omit<ComponentProps<"figure">, "children"> & {
  data: FunnelStep[];
  label: string;
  format?: Format;
  color?: string;
};

export function FunnelChart({ data, label, format = formatCompact, color = "var(--brand)", className, ...props }: FunnelChartProps) {
  const progress = useDrawIn();
  const [active, setActive] = useState<number | null>(null);
  const first = Math.max(data[0]?.value ?? 0, 0) || 1;

  return (
    <figure data-slot="funnel-chart" className={cn("w-full", className)} {...props}>
      <figcaption className="sr-only">{label}</figcaption>
      <ol className="flex flex-col items-center" onPointerLeave={() => setActive(null)}>
        {data.map((step, i) => {
          const share = Math.min(Math.max(step.value, 0) / first, 1);
          const previous = i > 0 ? Math.max(data[i - 1].value, 0) : 0;
          return (
            <Fragment key={step.label}>
              {i > 0 && (
                <li aria-hidden className="py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
                  ↓ {previous > 0 ? Math.round((Math.max(step.value, 0) / previous) * 100) : 0}%
                </li>
              )}
              <li
                onPointerEnter={() => setActive(i)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 transition-opacity duration-200 motion-reduce:transition-none",
                  active !== null && active !== i && "opacity-40",
                )}
              >
                <div className="flex w-full items-baseline justify-between gap-4 text-sm">
                  <span className="font-semibold text-muted-foreground">{step.label}</span>
                  <span className="font-mono font-medium tabular-nums">{format(step.value)}</span>
                </div>
                <div
                  aria-hidden
                  className="h-6 rounded-full"
                  style={{
                    width: `${Math.max(share * 100, 4) * progress}%`,
                    background: color,
                    opacity: 1 - (i / Math.max(data.length, 1)) * 0.5,
                  }}
                />
              </li>
            </Fragment>
          );
        })}
      </ol>
    </figure>
  );
}
